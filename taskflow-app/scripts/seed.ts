/**
 * Database Seeding Script
 * Seeds database with realistic data from 2021-2025
 */

import { config } from 'dotenv';
import { ObjectId } from 'mongodb';
import User from '../server/User';
import Project from '../server/Project';
import Task from '../server/Task';
import Member from '../server/Member';
import Comment from '../server/Comment';
import * as bcrypt from 'bcryptjs';

config();

interface SeedUser {
  _id: ObjectId;
  full_name: string;
  email: string;
}

async function seed() {
  try {
    await Comment.query().delete();
    await Task.query().delete();
    await Member.query().delete();
    await Project.query().delete();

    const users: SeedUser[] = [];
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    let realUser = await User.where('email', 'darius.josua0309@gmail.com').first();
    if (!realUser) {
      realUser = await User.create({
        full_name: 'Darius Josua',
        email: 'darius.josua0309@gmail.com',
        password: 'google-oauth',
      });
    } else {
      await User.query().where('_id', realUser._id).update({
        password: 'google-oauth',
      });
      realUser = await User.where('_id', realUser._id).first();
    }
    users.push({
      _id: realUser!._id,
      full_name: realUser!.full_name,
      email: realUser!.email,
    });

    let dummyUser = await User.where('email', 'john@example.com').first();
    if (!dummyUser) {
      dummyUser = await User.create({
        full_name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
      });
    }
    users.push({
      _id: dummyUser._id,
      full_name: dummyUser.full_name,
      email: dummyUser.email,
    });

    const projects = [];
    
    const projectsData = [
      { name: 'E-Commerce Platform 2021', description: 'Online shopping platform with payment integration', year: 2021, ownerId: users[0]._id },
      { name: 'Mobile Banking App 2021', description: 'Secure mobile banking application', year: 2021, ownerId: users[0]._id },
      { name: 'HR Management System 2021', description: 'Employee management and payroll system', year: 2021, ownerId: users[1]._id },
      { name: 'Inventory Tracking 2021', description: 'Real-time inventory management', year: 2021, ownerId: users[0]._id },
      
      // 2022 Projects
      { name: 'Social Media Platform 2022', description: 'Professional networking platform', year: 2022, ownerId: users[0]._id },
      { name: 'Video Streaming Service 2022', description: 'Netflix-like streaming platform', year: 2022, ownerId: users[1]._id },
      { name: 'Food Delivery App 2022', description: 'On-demand food ordering and delivery', year: 2022, ownerId: users[0]._id },
      { name: 'Fitness Tracker 2022', description: 'Health and fitness monitoring app', year: 2022, ownerId: users[0]._id },
      { name: 'Learning Management 2022', description: 'Online education platform', year: 2022, ownerId: users[1]._id },
      
      // 2023 Projects
      { name: 'AI Chatbot Integration 2023', description: 'GPT-4 powered customer support', year: 2023, ownerId: users[0]._id },
      { name: 'Blockchain Wallet 2023', description: 'Cryptocurrency wallet application', year: 2023, ownerId: users[1]._id },
      { name: 'Smart Home Hub 2023', description: 'IoT device management platform', year: 2023, ownerId: users[0]._id },
      { name: 'Travel Booking System 2023', description: 'Hotel and flight reservation platform', year: 2023, ownerId: users[0]._id },
      { name: 'CRM System 2023', description: 'Customer relationship management', year: 2023, ownerId: users[1]._id },
      { name: 'Project Management Tool 2023', description: 'Team collaboration and task tracking', year: 2023, ownerId: users[0]._id },
      
      // 2024 Projects
      { name: 'Cloud Infrastructure 2024', description: 'AWS migration and Kubernetes deployment', year: 2024, ownerId: users[0]._id },
      { name: 'Data Analytics Dashboard 2024', description: 'Real-time business intelligence', year: 2024, ownerId: users[1]._id },
      { name: 'Telemedicine Platform 2024', description: 'Online healthcare consultation', year: 2024, ownerId: users[0]._id },
      { name: 'Real Estate Portal 2024', description: 'Property listing and management', year: 2024, ownerId: users[0]._id },
      { name: 'Music Streaming App 2024', description: 'Spotify-like music platform', year: 2024, ownerId: users[1]._id },
      { name: 'Ride Sharing Service 2024', description: 'Uber-like transportation app', year: 2024, ownerId: users[0]._id },
      
      // 2025 Projects
      { name: 'AI Code Assistant 2025', description: 'AI-powered coding companion', year: 2025, ownerId: users[0]._id },
      { name: 'Metaverse Platform 2025', description: 'Virtual reality social space', year: 2025, ownerId: users[1]._id },
      { name: 'Quantum Computing Lab 2025', description: 'Quantum algorithm development', year: 2025, ownerId: users[0]._id },
      { name: 'Green Energy Dashboard 2025', description: 'Renewable energy monitoring', year: 2025, ownerId: users[0]._id },
    ];

    for (const projectData of projectsData) {
      const { year, ...projectInfo } = projectData;
      const project = await Project.create(projectInfo);
      
      for (const user of users) {
        await Member.create({
          userId: user._id,
          projectId: project._id,
          role: (user._id.equals(project.ownerId) ? 'owner' : 'member') as any,
          invitation_status: 'accepted',
        });
      }
      
      projects.push({ ...project, year });
    }

    const statuses = ['backlog', 'todo', 'in_progress', 'done'] as const;
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;
    
    const getDate = (year: number, monthOffset: number) => {
      const date = new Date(year, monthOffset, Math.floor(Math.random() * 28) + 1);
      return date;
    };

    const taskTemplates = [
      'Setup project structure',
      'Design database schema',
      'Implement authentication',
      'Create REST API endpoints',
      'Build frontend UI components',
      'Write unit tests',
      'Setup CI/CD pipeline',
      'Deploy to production',
      'Performance optimization',
      'Security audit',
      'Documentation',
      'Bug fixes and improvements',
    ];

    const tasksData = [];
    let taskCount = 0;

    for (const project of projects) {
      const year = project.year as number;
      const tasksPerProject = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < tasksPerProject; i++) {
        const template = taskTemplates[i % taskTemplates.length];
        const statusIndex = Math.min(i, statuses.length - 1);
        const priorityIndex = Math.floor(Math.random() * priorities.length);
        const monthOffset = Math.floor(Math.random() * 12);
        const dueDate = getDate(year, monthOffset);
        
        const createdDate = new Date(dueDate);
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30) - 10);
        
        tasksData.push({
          projectId: project._id,
          title: `${template} - ${project.name}`,
          description: `Complete ${template.toLowerCase()} for ${project.name}`,
          status: statuses[statusIndex],
          priority: priorities[priorityIndex],
          due_date: dueDate,
          createdAt: createdDate,
          updatedAt: createdDate,
        });
        taskCount++;
      }
    }

    for (const taskData of tasksData) {
      const { createdAt, updatedAt, ...taskFields } = taskData;
      
      const task = await Task.create({
        ...taskFields,
        status: taskData.status as any,
        priority: taskData.priority as any,
      });
      
      await Task.query()
        .where('_id', task._id)
        .update({
          createdAt: createdAt,
          updatedAt: updatedAt,
        } as any);
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

seed();
