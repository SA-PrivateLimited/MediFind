// Consultation feature type definitions

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number; // Years of experience
  profileImage: string; // Firebase Storage URL
  qualifications: string[]; // ["MBBS", "MD"]
  rating: number; // Average rating (0-5)
  totalConsultations: number;
  consultationFee: number;
  languages: string[]; // ["English", "Hindi"]
  verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  dateOfBirth?: Date;
  gender?: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalHistory?: string[];
  createdAt?: Date;
  fcmToken?: string; // For push notifications
}

export interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string; // "09:30"
  isBooked: boolean;
  consultationId?: string; // If booked
}

export interface DoctorAvailability {
  id: string;
  doctorId: string; // Reference to doctors collection
  date: string; // "2025-11-29" format
  slots: TimeSlot[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type ConsultationStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface Consultation {
  id: string;
  patientId: string; // User ID
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  scheduledTime: Date;
  duration: number; // Minutes (default 30)
  status: ConsultationStatus;
  consultationFee: number;
  agoraChannelName: string; // For video call
  agoraToken?: string; // Generated when call starts
  symptoms?: string;
  notes?: string; // Patient notes before consultation
  doctorNotes?: string; // Doctor's notes after consultation
  prescriptionId?: string; // Reference to prescription
  createdAt?: Date;
  updatedAt?: Date;
}

export type MessageType = 'text' | 'image' | 'prescription';
export type SenderType = 'patient' | 'doctor';

export interface ChatMessage {
  id: string;
  consultationId: string; // Reference to consultation
  senderId: string; // User or Doctor ID
  senderName: string;
  senderType: SenderType;
  message: string;
  messageType: MessageType;
  imageUrl?: string; // For image messages
  timestamp: Date;
  read: boolean;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  medications: Medication[];
  diagnosis: string;
  advice: string;
  followUpDate?: Date;
  prescriptionImageUrl?: string; // Uploaded or generated PDF
  createdAt?: Date;
}

// Request/Response types for service methods
export interface BookingData {
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  patientId: string;
  patientName: string;
  scheduledTime: Date;
  consultationFee: number;
  symptoms?: string;
  notes?: string;
}

export interface SendMessageData {
  consultationId: string;
  senderId: string;
  senderName: string;
  senderType: SenderType;
  message: string;
  messageType: MessageType;
  imageUrl?: string;
}
