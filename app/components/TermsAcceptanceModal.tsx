import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

interface TermsAcceptanceModalProps {
  visible: boolean;
  onClose: () => void;
}

const TermsAcceptanceModal: React.FC<TermsAcceptanceModalProps> = ({ visible, onClose }) => {
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();
  const acceptTerms = useMutation(api.users.acceptTerms);

  const handleAccept = async () => {
    if (!accepted) return;
    try {
      await acceptTerms();
      onClose();
    } catch (error) {
      console.error('Error accepting terms:', error);
    }
  };

  const handleViewTerms = () => {
    router.push('/terms');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View className="flex-1 bg-white justify-center items-center p-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md">
          <View className="items-center mb-6">
            <Ionicons name="document-text-outline" size={48} color="#4f46e5" />
            <Text className="text-xl font-quicksand-bold text-slate-800 mt-4 text-center">
              Términos y Condiciones
            </Text>
          </View>

          <Text className="text-base font-quicksand-medium text-slate-700 mb-6 text-center leading-6">
            Para continuar usando la app, debes aceptar nuestros términos y condiciones.
          </Text>

          <View className="flex-row items-center mb-4">
            <Pressable
              onPress={() => setAccepted(!accepted)}
              className={`w-6 h-6 border-2 rounded mr-3 items-center justify-center ${
                accepted ? 'bg-primary border-primary' : 'border-slate-300'
              }`}
            >
              {accepted && <Ionicons name="checkmark" size={16} color="white" />}
            </Pressable>
            <Text className="text-base font-quicksand-medium text-slate-700 flex-1">
              Acepto los{' '}
              <Text
                className="text-primary underline"
                onPress={handleViewTerms}
              >
                términos y condiciones
              </Text>
            </Text>
          </View>

          <Pressable
            onPress={handleAccept}
            disabled={!accepted}
            className={`h-12 rounded-lg items-center justify-center ${
              accepted ? 'bg-primary active:bg-primary/80' : 'bg-slate-300'
            }`}
          >
            <Text className="text-white font-quicksand-bold">Aceptar y Continuar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default TermsAcceptanceModal;