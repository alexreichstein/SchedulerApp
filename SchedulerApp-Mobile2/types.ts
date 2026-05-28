// Definierar datastrukturen för en kalenderhändelse
export type Event = {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  userId: number;
  categoryId: number | null;
  reminderMinutes: number;
  templateColor: string | null;
};

// Typ av mall — fast tid eller fast längd
export type TemplateType = 'fixed_time' | 'duration';

// Definierar datastrukturen för en aktivitetsmall
export type Template = {
  id: string;
  name: string;
  color: string;
  type: TemplateType;        // 'fixed_time' = fast tid, 'duration' = fast längd
  // Används när type = 'fixed_time'
  startHour?: number;
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
  // Används när type = 'duration'
  durationMinutes?: number;
  createdBy: number;
};