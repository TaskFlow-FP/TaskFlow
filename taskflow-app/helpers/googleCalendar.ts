import { google } from 'googleapis';

interface CalendarEventDetails {
  taskTitle: string;
  taskDescription: string;
  projectName?: string;
  status: string;
  priority: string;
  dueDate: Date;
}

// Helper function to get color ID based on priority
function getColorIdByPriority(priority: string): string {
  const colorMap: { [key: string]: string } = {
    urgent: '11', // Red
    high: '9',    // Blue
    medium: '5',  // Yellow
    low: '2',     // Green
  };
  return colorMap[priority.toLowerCase()] || '1'; // Default gray
}

// Helper function to get status emoji
function getStatusEmoji(status: string): string {
  const statusMap: { [key: string]: string } = {
    backlog: '📋',
    todo: '📝',
    in_progress: '🚀',
    done: '✅',
  };
  return statusMap[status.toLowerCase()] || '📌';
}

// Helper function to format detailed description
function formatEventDescription(details: CalendarEventDetails): string {
  const { taskDescription, projectName, status, priority } = details;
  
  let description = `🎯 TaskFlow Task\n\n`;
  
  if (projectName) {
    description += `📁 Project: ${projectName}\n`;
  }
  
  description += `${getStatusEmoji(status)} Status: ${status.replace('_', ' ').toUpperCase()}\n`;
  description += `⚡ Priority: ${priority.toUpperCase()}\n`;
  description += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  if (taskDescription) {
    description += `📄 Description:\n${taskDescription}\n\n`;
  }
  
  description += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  description += `Created via TaskFlow - Your Smart Task Manager`;
  
  return description;
}

export async function createCalendarEvent(
  accessToken: string,
  details: CalendarEventDetails
): Promise<string> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const statusEmoji = getStatusEmoji(details.status);
  const colorId = getColorIdByPriority(details.priority);
  const eventTitle = details.projectName 
    ? `${statusEmoji} [${details.projectName}] ${details.taskTitle}`
    : `${statusEmoji} ${details.taskTitle}`;

  const event = {
    summary: eventTitle,
    description: formatEventDescription(details),
    start: {
      dateTime: details.dueDate.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(details.dueDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
      timeZone: 'UTC',
    },
    colorId: colorId,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 1440 }, // 1 day before
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  if (!response.data.id) {
    throw new Error('Failed to create calendar event');
  }

  return response.data.id;
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  details: CalendarEventDetails
) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const statusEmoji = getStatusEmoji(details.status);
  const colorId = getColorIdByPriority(details.priority);
  const eventTitle = details.projectName 
    ? `${statusEmoji} [${details.projectName}] ${details.taskTitle}`
    : `${statusEmoji} ${details.taskTitle}`;

  const event = {
    summary: eventTitle,
    description: formatEventDescription(details),
    start: {
      dateTime: details.dueDate.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(details.dueDate.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: 'UTC',
    },
    colorId: colorId,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 1440 }, // 1 day before
      ],
    },
  };

  await calendar.events.update({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: event,
  });
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });
}
