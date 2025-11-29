import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import type {
  Doctor,
  DoctorAvailability,
  Consultation,
  BookingData,
  Prescription,
  TimeSlot,
} from '../types/consultation';

/**
 * Consultation Service
 * Handles all Firebase Firestore operations for doctor consultations
 */

const COLLECTIONS = {
  DOCTORS: 'doctors',
  USERS: 'users',
  AVAILABILITY: 'availability',
  CONSULTATIONS: 'consultations',
  PRESCRIPTIONS: 'prescriptions',
};

/**
 * Fetch all doctors from Firestore
 */
export const fetchDoctors = async (): Promise<Doctor[]> => {
  try {
    console.log('Fetching doctors from Firestore...');
    const snapshot = await firestore()
      .collection(COLLECTIONS.DOCTORS)
      .get();

    let doctors: Doctor[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Doctor[];

    // Filter verified doctors and sort by rating in-memory
    doctors = doctors
      .filter(doc => doc.verified === true)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    console.log(`Fetched ${doctors.length} doctors`);
    return doctors;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw new Error('Failed to fetch doctors. Please try again.');
  }
};

/**
 * Fetch a single doctor by ID
 */
export const fetchDoctorById = async (doctorId: string): Promise<Doctor> => {
  try {
    console.log(`Fetching doctor ${doctorId}...`);
    const doc = await firestore()
      .collection(COLLECTIONS.DOCTORS)
      .doc(doctorId)
      .get();

    if (!doc.exists) {
      throw new Error('Doctor not found');
    }

    const doctor: Doctor = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
    } as Doctor;

    return doctor;
  } catch (error) {
    console.error('Error fetching doctor:', error);
    throw new Error('Failed to fetch doctor details. Please try again.');
  }
};

/**
 * Search doctors by specialization
 */
export const searchDoctorsBySpecialization = async (
  specialization: string,
): Promise<Doctor[]> => {
  try {
    console.log(`Searching doctors by specialization: ${specialization}`);
    const snapshot = await firestore()
      .collection(COLLECTIONS.DOCTORS)
      .where('verified', '==', true)
      .where('specialization', '==', specialization)
      .orderBy('rating', 'desc')
      .get();

    const doctors: Doctor[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Doctor[];

    console.log(`Found ${doctors.length} doctors`);
    return doctors;
  } catch (error) {
    console.error('Error searching doctors:', error);
    throw new Error('Failed to search doctors. Please try again.');
  }
};

/**
 * Fetch doctor availability for a specific date
 */
export const fetchDoctorAvailability = async (
  doctorId: string,
  date: string, // Format: "2025-11-29"
): Promise<TimeSlot[]> => {
  try {
    console.log(`Fetching availability for doctor ${doctorId} on ${date}`);
    const docId = `${doctorId}_${date}`;
    const doc = await firestore()
      .collection(COLLECTIONS.AVAILABILITY)
      .doc(docId)
      .get();

    if (!doc.exists) {
      console.log('No availability found for this date');
      return [];
    }

    const availability = doc.data() as DoctorAvailability;
    return availability.slots || [];
  } catch (error) {
    console.error('Error fetching availability:', error);
    throw new Error('Failed to fetch availability. Please try again.');
  }
};

/**
 * Book a consultation with a doctor
 * Uses Firestore transaction to prevent double-booking
 */
export const bookConsultation = async (
  bookingData: BookingData,
  selectedSlot: TimeSlot,
  selectedDate: string,
): Promise<Consultation> => {
  try {
    console.log('Booking consultation...');

    // Generate consultation ID and channel name
    const consultationRef = firestore()
      .collection(COLLECTIONS.CONSULTATIONS)
      .doc();

    const consultationId = consultationRef.id;
    const agoraChannelName = `consultation_${consultationId}`;

    // Create consultation object
    const consultation: Omit<Consultation, 'id'> = {
      patientId: bookingData.patientId,
      patientName: bookingData.patientName,
      doctorId: bookingData.doctorId,
      doctorName: bookingData.doctorName,
      doctorSpecialization: bookingData.doctorSpecialization,
      scheduledTime: bookingData.scheduledTime,
      duration: 30, // Default 30 minutes
      status: 'scheduled',
      consultationFee: bookingData.consultationFee,
      agoraChannelName,
      symptoms: bookingData.symptoms,
      notes: bookingData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Run transaction to book slot and create consultation
    await firestore().runTransaction(async transaction => {
      const availabilityDocId = `${bookingData.doctorId}_${selectedDate}`;
      const availabilityRef = firestore()
        .collection(COLLECTIONS.AVAILABILITY)
        .doc(availabilityDocId);

      const availabilityDoc = await transaction.get(availabilityRef);

      if (!availabilityDoc.exists) {
        throw new Error('Availability not found');
      }

      const slots = availabilityDoc.data()?.slots || [];
      const slotIndex = slots.findIndex(
        (s: TimeSlot) => s.startTime === selectedSlot.startTime,
      );

      if (slotIndex === -1) {
        throw new Error('Time slot not found');
      }

      if (slots[slotIndex].isBooked) {
        throw new Error('This slot has already been booked');
      }

      // Mark slot as booked
      slots[slotIndex].isBooked = true;
      slots[slotIndex].consultationId = consultationId;

      // Update availability
      transaction.update(availabilityRef, {
        slots,
        updatedAt: new Date(),
      });

      // Create consultation
      transaction.set(consultationRef, consultation);
    });

    console.log('Consultation booked successfully:', consultationId);

    return {
      id: consultationId,
      ...consultation,
    };
  } catch (error: any) {
    console.error('Error booking consultation:', error);
    if (error.message === 'This slot has already been booked') {
      throw error;
    }
    throw new Error('Failed to book consultation. Please try again.');
  }
};

/**
 * Fetch all consultations for a user
 */
export const fetchUserConsultations = async (
  userId: string,
): Promise<Consultation[]> => {
  try {
    console.log(`Fetching consultations for user ${userId}`);
    const snapshot = await firestore()
      .collection(COLLECTIONS.CONSULTATIONS)
      .where('patientId', '==', userId)
      .orderBy('scheduledTime', 'desc')
      .get();

    const consultations: Consultation[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scheduledTime: doc.data().scheduledTime?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Consultation[];

    console.log(`Fetched ${consultations.length} consultations`);
    return consultations;
  } catch (error) {
    console.error('Error fetching consultations:', error);
    throw new Error('Failed to fetch consultations. Please try again.');
  }
};

/**
 * Fetch a single consultation by ID
 */
export const fetchConsultationById = async (
  consultationId: string,
): Promise<Consultation> => {
  try {
    const doc = await firestore()
      .collection(COLLECTIONS.CONSULTATIONS)
      .doc(consultationId)
      .get();

    if (!doc.exists) {
      throw new Error('Consultation not found');
    }

    const consultation: Consultation = {
      id: doc.id,
      ...doc.data(),
      scheduledTime: doc.data()?.scheduledTime?.toDate(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
    } as Consultation;

    return consultation;
  } catch (error) {
    console.error('Error fetching consultation:', error);
    throw new Error('Failed to fetch consultation. Please try again.');
  }
};

/**
 * Update consultation status
 */
export const updateConsultationStatus = async (
  consultationId: string,
  status: Consultation['status'],
): Promise<void> => {
  try {
    console.log(`Updating consultation ${consultationId} status to ${status}`);
    await firestore()
      .collection(COLLECTIONS.CONSULTATIONS)
      .doc(consultationId)
      .update({
        status,
        updatedAt: new Date(),
      });

    console.log('Consultation status updated');
  } catch (error) {
    console.error('Error updating consultation status:', error);
    throw new Error('Failed to update consultation status.');
  }
};

/**
 * Cancel a consultation
 */
export const cancelConsultation = async (
  consultationId: string,
): Promise<void> => {
  try {
    console.log(`Cancelling consultation ${consultationId}`);
    await updateConsultationStatus(consultationId, 'cancelled');
    console.log('Consultation cancelled successfully');
  } catch (error) {
    console.error('Error cancelling consultation:', error);
    throw new Error('Failed to cancel consultation.');
  }
};

/**
 * Fetch prescriptions for a user
 */
export const fetchPrescriptions = async (
  userId: string,
): Promise<Prescription[]> => {
  try {
    console.log(`Fetching prescriptions for user ${userId}`);
    const snapshot = await firestore()
      .collection(COLLECTIONS.PRESCRIPTIONS)
      .where('patientId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const prescriptions: Prescription[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      followUpDate: doc.data().followUpDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Prescription[];

    console.log(`Fetched ${prescriptions.length} prescriptions`);
    return prescriptions;
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    throw new Error('Failed to fetch prescriptions. Please try again.');
  }
};

/**
 * Fetch a single prescription by ID
 */
export const fetchPrescriptionById = async (
  prescriptionId: string,
): Promise<Prescription> => {
  try {
    const doc = await firestore()
      .collection(COLLECTIONS.PRESCRIPTIONS)
      .doc(prescriptionId)
      .get();

    if (!doc.exists) {
      throw new Error('Prescription not found');
    }

    const prescription: Prescription = {
      id: doc.id,
      ...doc.data(),
      followUpDate: doc.data()?.followUpDate?.toDate(),
      createdAt: doc.data()?.createdAt?.toDate(),
    } as Prescription;

    return prescription;
  } catch (error) {
    console.error('Error fetching prescription:', error);
    throw new Error('Failed to fetch prescription. Please try again.');
  }
};

/**
 * Generate Agora token for video call (via Cloud Function)
 */
export const generateAgoraToken = async (
  channelName: string,
  userId: string,
): Promise<string> => {
  try {
    console.log(`Generating Agora token for channel ${channelName}`);
    const generateToken = functions().httpsCallable('generateAgoraToken');
    const result = await generateToken({channelName, uid: userId});

    if (!result.data || !result.data.token) {
      throw new Error('Invalid token response');
    }

    console.log('Agora token generated successfully');
    return result.data.token;
  } catch (error) {
    console.error('Error generating Agora token:', error);
    throw new Error('Failed to generate video call token. Please try again.');
  }
};

export default {
  fetchDoctors,
  fetchDoctorById,
  searchDoctorsBySpecialization,
  fetchDoctorAvailability,
  bookConsultation,
  fetchUserConsultations,
  fetchConsultationById,
  updateConsultationStatus,
  cancelConsultation,
  fetchPrescriptions,
  fetchPrescriptionById,
  generateAgoraToken,
};
