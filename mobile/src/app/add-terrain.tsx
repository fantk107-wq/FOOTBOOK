import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../services/api';

export default function AddTerrainScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('5 contre 5');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name || !location || !price) {
      setError('Nom, localisation et prix sont obligatoires.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_URL}/api/terrains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          location,
          type,
          price_per_slot: Number(price),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la création.');
      
      alert('Terrain créé avec succès ! Il est en attente de validation par l\'administrateur.');
      router.back();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>➕ Nouveau terrain</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.label}>Nom du terrain *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Terrain Itaosy Elite" />

      <Text style={styles.label}>Localisation *</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Ex: Itaosy, Antananarivo" />

      <Text style={styles.label}>Type de terrain *</Text>
      <View style={styles.typeContainer}>
        {['5 contre 5', '7 contre 7', '11 contre 11'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeButton, type === t && styles.typeButtonActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Prix par créneau de 2h (Ar) *</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="Ex: 60000"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description du terrain..."
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Créer le terrain</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40, backgroundColor: '#F5F5F5', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32', marginBottom: 20, textAlign: 'center' },
  errorText: { color: '#D32F2F', marginBottom: 12, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeContainer: { flexDirection: 'row', gap: 8, marginTop: 4 },
  typeButton: { flex: 1, padding: 10, borderRadius: 6, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  typeButtonActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  typeText: { color: '#333', fontWeight: 'bold' },
  typeTextActive: { color: '#FFF' },
  button: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});