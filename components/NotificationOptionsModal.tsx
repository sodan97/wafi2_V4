import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Product } from '../types';
import { View } from '../App';

interface NotificationOptionsModalProps {
  product: Product;
  onClose: () => void;
  setView: (view: View) => void;
  setPendingReservation: (productId: number) => void;
}

const NotificationOptionsModal: React.FC<NotificationOptionsModalProps> = ({
  product,
  onClose,
}) => {
  const [showWhatsAppQR, setShowWhatsAppQR] = useState(false);

  // Générer l'URL WhatsApp avec le message
  const merchantNumber = import.meta.env.VITE_MERCHANT_WHATSAPP_NUMBER || '221123456789';
  const message = `Bonjour, je souhaite être notifié quand le produit "${product.name}" sera de nouveau en stock. Merci !`;
  const whatsappUrl = `https://wa.me/${merchantNumber}?text=${encodeURIComponent(message)}`;

  if (showWhatsAppQR) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
          <h2 className="text-xl font-bold mb-4">Notification WhatsApp</h2>
          <p className="mb-4 text-gray-600">Scannez ce code QR avec votre téléphone pour envoyer le message :</p>

          <div className="flex justify-center mb-4">
            <QRCodeCanvas value={whatsappUrl} size={200} fgColor="#25D366" />
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Ou cliquez sur le bouton ci-dessous sur votre téléphone :
          </p>

          <button
            onClick={() => window.open(whatsappUrl, '_blank')}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition mb-4"
          >
            Ouvrir WhatsApp
          </button>

          <button
            onClick={() => setShowWhatsAppQR(false)}
            className="w-full text-gray-600 hover:text-gray-800 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Notification pour {product.name}</h2>
        <p className="mb-6 text-gray-600">Vous serez notifié via WhatsApp lorsque ce produit sera de nouveau disponible.</p>

        <button
          onClick={() => setShowWhatsAppQR(true)}
          className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.398 1.919 6.335l-1.251 4.565 4.659-1.225z"/>
          </svg>
          Notifier par WhatsApp
        </button>

        <button
          onClick={onClose}
          className="mt-4 w-full text-gray-600 hover:text-gray-800 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default NotificationOptionsModal;