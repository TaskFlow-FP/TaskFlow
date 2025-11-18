import { google } from 'googleapis';

export async function createCalendarEvent(
  accessToken: string,
  taskTitle: string,
  taskDescription: string,
  dueDate: Date
): Promise<string> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: taskTitle,
    description: taskDescription,
    start: {
      dateTime: dueDate.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
      timeZone: 'UTC',
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
  taskTitle: string,
  taskDescription: string,
  dueDate: Date
) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: taskTitle,
    description: taskDescription,
    start: {
      dateTime: dueDate.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: 'UTC',
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
