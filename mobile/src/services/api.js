// L'adresse IP de ton ordinateur sur le réseau Wi-Fi
// ⚠️ Si ton IP change un jour, modifie uniquement cette ligne.
export const API_URL = 'http://192.168.1.75:3000';

// Fonction utilitaire pour faire des requêtes GET simples
export async function fetchData(endpoint) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur serveur');
    }
    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
}