import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../services/api';

interface Reservation {
  id: number;
  terrain_name: string;
  terrain_location: string;
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

const statusColors: Record<string, string> = {
  pending: '#F57C00',
  confirmed: '#2E7D32',
  rejected: '#D32F2F',
  cancelled: '#757575',
  expired: '#757575',
  completed: '#1976D2',
};

export default function MesReservationsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    loadReservations();
  }, [token]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/reservations/my`, {
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes réservations</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.terrain_name}</Text>
            <Text style={styles.cardInfo}>📍 {item.terrain_location}</Text>
            <Text style={styles.cardInfo}>📅 {item.date} · {item.start_time} - {item.end_time}</Text>
            <Text style={[styles.status, { color: statusColors[item.status] || '#333' }]}>
              Statut : {statusLabels[item.status] || item.status}
            </Text>
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
  status: { marginTop: 8, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
});