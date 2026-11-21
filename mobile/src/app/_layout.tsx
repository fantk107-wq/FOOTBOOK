import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Accueil', headerShown: false }} />
        <Stack.Screen name="terrain/[id]" options={{ title: 'Détails du terrain' }} />
        <Stack.Screen name="login" options={{ title: 'Connexion' }} />
        <Stack.Screen name="mes-reservations" options={{ title: 'Mes réservations' }} />
        <Stack.Screen name="owner-reservations" options={{ title: 'Espace Propriétaire' }} />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}