import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../services/api';

interface Reservation {
  id: number;
  terrain_name: string;
  client_name: string;
  client_phone: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  rejected: 'Refusée',
  cancelled: 'Annulée',
  expired: 'Expirée',
  completed: 'Terminée',
};

export default function OwnerReservationsScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || user?.role !== 'owner') {
      router.replace('/');
      return;
    }
    loadReservations();
  }, [token, user]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/reservations/owner`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReservations(data);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, action: 'confirm' | 'reject') => {
    try {
      const response = await fetch(`${API_URL}/api/reservations/${id}/${action}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert(data.message);
      loadReservations(); // Recharger la liste
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Espace Propriétaire</Text>
      
      {/* --- BOUTON AJOUTER UN TERRAIN --- */}
      <TouchableOpacity
        style={styles.addTerrainBtn}
        onPress={() => router.push('/add-terrain')}
      >
        <Text style={styles.addTerrainText}>➕ Ajouter un terrain</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.terrain_name}</Text>
            <Text style={styles.cardInfo}>👤 {item.client_name} ({item.client_phone})</Text>
            <Text style={styles.cardInfo}>📅 {item.date} · {item.start_time} - {item.end_time}</Text>
            <Text style={styles.cardStatus}>Statut : {statusLabels[item.status] || item.status}</Text>

            {item.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.confirmBtn]} 
                  onPress={() => updateStatus(item.id, 'confirm')}
                >
                  <Text style={styles.actionText}>✅ Confirmer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.rejectBtn]} 
                  onPress={() => updateStatus(item.id, 'reject')}
                >
                  <Text style={styles.actionText}>❌ Refuser</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune réservation pour le moment.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', paddingTop: 60, paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2E7D32', marginBottom: 20 },
  addTerrainBtn: {
    backgroundColor: '#2E7D32',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  addTerrainText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  errorText: { color: '#D32F2F', marginBottom: 12 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  cardInfo: { fontSize: 14, color: '#555', marginBottom: 2 },
  cardStatus: { marginTop: 8, fontWeight: 'bold', color: '#333' },
  actions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 6, alignItems: 'center' },
  confirmBtn: { backgroundColor: '#2E7D32' },
  rejectBtn: { backgroundColor: '#D32F2F' },
  actionText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
});