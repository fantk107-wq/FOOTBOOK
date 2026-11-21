import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { fetchData } from '../../services/api';

interface Terrain {
  id: number;
  name: string;
  location: string;
  type: string;
  price_per_slot: number;
  description: string;
  owner_name: string;
}

interface Slot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export default function TerrainDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [terrain, setTerrain] = useState<Terrain | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState('2026-11-23');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTerrain();
  }, [id]);

  useEffect(() => {
    loadSlots();
  }, [date]);

  const loadTerrain = async () => {
    try {
      const data = await fetchData(`/api/terrains/${id}`);
      setTerrain(data);
    } catch (err) {
      setError('Impossible de charger le terrain.');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const data = await fetchData(`/api/terrains/${id}/slots?date=${date}`);
      setSlots(data.slots || []);
    } catch (err) {
      setSlots([]);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (error || !terrain) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Terrain introuvable.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{terrain.name}</Text>
      <Text style={styles.info}>📍 {terrain.location}</Text>
      <Text style={styles.info}>🏟️ {terrain.type}</Text>
      <Text style={styles.price}>{terrain.price_per_slot} Ar / 2h</Text>
      <Text style={styles.description}>{terrain.description}</Text>
      <Text style={styles.owner}>Propriétaire : {terrain.owner_name}</Text>

      <Text style={styles.sectionTitle}>Créneaux pour le {date}</Text>

      <FlatList
        data={slots}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={[styles.slot, !item.available && styles.slotDisabled]}>
            <Text style={styles.slotTime}>{item.start_time} - {item.end_time}</Text>
            <Text style={item.available ? styles.slotAvailable : styles.slotUnavailable}>
              {item.available ? 'Disponible' : 'Indisponible'}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun créneau pour cette date.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', paddingTop: 60, paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  errorText: { color: '#D32F2F', fontSize: 16, textAlign: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2E7D32', marginBottom: 12 },
  info: { fontSize: 16, color: '#555', marginBottom: 4 },
  price: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32', marginVertical: 12 },
  description: { fontSize: 14, color: '#666', fontStyle: 'italic', marginBottom: 12 },
  owner: { fontSize: 14, color: '#333', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  slot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotDisabled: { backgroundColor: '#E0E0E0' },
  slotTime: { fontSize: 16, color: '#333' },
  slotAvailable: { color: '#2E7D32', fontWeight: 'bold' },
  slotUnavailable: { color: '#D32F2F', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
});