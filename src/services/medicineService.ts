import axios from 'axios';
import {OPENAI_API_KEY} from '@env';

const DRUGS_API_URL = 'https://api.fda.gov/drug/label.json';

export interface MedicineData {
  name: string;
  description: string;
  ingredients: string[];
  uses: string;
  sideEffects: string;
  dosage: string;
  warnings: string;
}

/**
 * Search medicine information from FDA API
 */
export const searchMedicineFromFDA = async (
  medicineName: string,
): Promise<MedicineData | null> => {
  try {
    console.log(`Searching FDA for: ${medicineName}`);

    // Try multiple search strategies
    const searchQueries = [
      `openfda.brand_name:"${medicineName}"`,
      `openfda.generic_name:"${medicineName}"`,
      `openfda.substance_name:"${medicineName}"`,
    ];

    for (const searchQuery of searchQueries) {
      try {
        const response = await axios.get(DRUGS_API_URL, {
          params: {
            search: searchQuery,
            limit: 1,
          },
          timeout: 10000,
        });

        if (response.data?.results?.length > 0) {
          const drug = response.data.results[0];
          console.log('FDA result found with query:', searchQuery);

          return {
            name: medicineName,
            description:
              drug.description?.join(' ') ||
              drug.purpose?.join(' ') ||
              'No description available',
            ingredients:
              drug.active_ingredient || drug.inactive_ingredient || [],
            uses:
              drug.indications_and_usage?.join(' ') ||
              drug.purpose?.join(' ') ||
              'No usage information available',
            sideEffects:
              drug.adverse_reactions?.join(' ') ||
              drug.warnings?.join(' ') ||
              'No side effects information available',
            dosage:
              drug.dosage_and_administration?.join(' ') ||
              'No dosage information available',
            warnings:
              drug.warnings?.join(' ') ||
              drug.contraindications?.join(' ') ||
              'No warnings available',
          };
        }
      } catch (queryError) {
        // Continue to next query
        console.log(`Query failed: ${searchQuery}`, queryError);
      }
    }

    return null;
  } catch (error) {
    console.error('FDA API Error:', error);
    return null;
  }
};

/**
 * Fallback: Search from Drugs.com using web scraping approach
 * Note: This is a simplified version. For production, you'd need a backend API
 */
export const searchMedicineFromWeb = async (
  medicineName: string,
): Promise<MedicineData | null> => {
  try {
    console.log(`Searching RxNav for: ${medicineName}`);

    // Alternative: RxNav API from NIH
    const rxnavUrl = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(
      medicineName,
    )}`;

    const response = await axios.get(rxnavUrl, {timeout: 10000});

    if (response.data?.drugGroup?.conceptGroup) {
      const concepts = response.data.drugGroup.conceptGroup;
      let drugName = medicineName;
      let rxcui = null;

      for (const group of concepts) {
        if (group.conceptProperties?.length > 0) {
          drugName = group.conceptProperties[0].name;
          rxcui = group.conceptProperties[0].rxcui;
          break;
        }
      }

      console.log(`RxNav result found: ${drugName} (RXCUI: ${rxcui})`);

      // For now, return basic info - in production, you'd fetch more details
      return {
        name: drugName,
        description: `${drugName} is a pharmaceutical product. This is basic information from the RxNav database.`,
        ingredients: [drugName],
        uses:
          'For detailed information about uses and indications, please consult the AI Assistant tab or speak with a healthcare professional.',
        sideEffects:
          'For detailed side effects information, please use the AI Assistant tab or consult a healthcare professional.',
        dosage:
          'For proper dosage information, please consult the AI Assistant tab or a healthcare professional.',
        warnings:
          'Always consult a healthcare professional before taking any medication. Use the AI Assistant tab for more detailed information.',
      };
    }

    console.log('RxNav: No results found');
    return null;
  } catch (error) {
    console.error('RxNav API error:', error);
    return null;
  }
};

/**
 * Get detailed medicine information using OpenAI
 */
export const getMedicineInfoFromOpenAI = async (
  medicineName: string,
  question?: string,
): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OpenAI API key not configured. Please add it to your .env file',
    );
  }

  try {
    const prompt = question
      ? `Provide detailed information about ${medicineName} medicine, specifically answering: ${question}. Include relevant medical details, but remind users to consult healthcare professionals.`
      : `Provide comprehensive information about ${medicineName} medicine including:
1. Description and what it's used for
2. Active ingredients
3. Common uses and indications
4. Possible side effects
5. Recommended dosage (general information)
6. Warnings and precautions
7. Drug interactions to be aware of

Format the response in a clear, structured manner. Always remind users to consult healthcare professionals.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a knowledgeable medical information assistant. Provide accurate, well-structured information about medications. Always remind users to consult healthcare professionals for medical advice.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 30000,
      },
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    throw new Error(
      'Failed to get information from OpenAI. Please check your API key and try again.',
    );
  }
};

/**
 * Main search function that tries multiple sources
 */
export const searchMedicine = async (
  medicineName: string,
): Promise<MedicineData> => {
  // Try FDA API first
  let result = await searchMedicineFromFDA(medicineName);

  // If FDA doesn't have it, try web scraping
  if (!result) {
    result = await searchMedicineFromWeb(medicineName);
  }

  // If still no result, throw error
  if (!result) {
    throw new Error(
      `Medicine "${medicineName}" not found. Try asking for more details using the AI assistant.`,
    );
  }

  return result;
};
