import { getCurrentUser } from "@/helpers/auth";
import Task from "@/server/Task";
import Member from "@/server/Member";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);

    const memberships = await Member.where('userId', new ObjectId(currentUser.id))
      .where('invitation_status', 'accepted')
      .get();
    const projectIds = memberships.map(member => member.projectId);

    if (projectIds.length === 0) {
      return NextResponse.json({
        yearlyStats: [],
        currentMonthStats: {
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0,
          backlog: 0
        },
        priorityBreakdown: { urgent: 0, high: 0, medium: 0, low: 0 },
        completionRate: 0,
        totalTasks: 0,
        completedTasks: 0,
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        currentMonthName: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }

    const tasks = await Task.whereIn('projectId', projectIds).get();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentMonthStats = {
      total: 0,
      completed: 0,
      inProgress: 0,
      todo: 0,
      backlog: 0
    };

    const priorityBreakdown = { urgent: 0, high: 0, medium: 0, low: 0 };

    tasks.forEach(task => {
      const createdAt = task.createdAt || (task as any).created_at;
      if (!createdAt) return;
      
      const createdDate = new Date(createdAt);

      if (createdDate.getFullYear() === currentYear && createdDate.getMonth() === currentMonth) {
        currentMonthStats.total++;
        
        switch (task.status) {
          case 'done':
            currentMonthStats.completed++;
            break;
          case 'in_progress':
            currentMonthStats.inProgress++;
            break;
          case 'todo':
            currentMonthStats.todo++;
            break;
          case 'backlog':
            currentMonthStats.backlog++;
            break;
        }
      }

      if (task.status !== 'done') {
        priorityBreakdown[task.priority]++;
      }
    });

    const yearlyStats = [];
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      const yearTasks = tasks.filter(task => {
        const createdAt = task.createdAt || (task as any).created_at;
        if (!createdAt) return false;
        
        const createdDate = new Date(createdAt);
        const taskYear = createdDate.getFullYear();
        return taskYear === year;
      });
      
      const completedTasks = yearTasks.filter(task => task.status === 'done').length;
      
      yearlyStats.push({
        year: year.toString(),
        total: yearTasks.length,
        completed: completedTasks,
        completionRate: yearTasks.length > 0 ? Math.round((completedTasks / yearTasks.length) * 100) : 0
      });
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      yearlyStats,
      currentMonthStats,
      priorityBreakdown,
      completionRate,
      totalTasks,
      completedTasks,
      currentYear,
      currentMonth: currentMonth + 1, // 1-based month
      currentMonthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });
  } catch (error: any) {
    if (error.message === "Not authenticated" || error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
