export function generateWhatsAppLink(phoneNumber: string, message?: string): string {
  // Remove any non-digit characters except +
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure it starts with country code (India is +91)
  let formattedNumber = cleanNumber;
  if (!formattedNumber.startsWith('+')) {
    if (formattedNumber.startsWith('91')) {
      formattedNumber = '+' + formattedNumber;
    } else if (formattedNumber.startsWith('0')) {
      formattedNumber = '+91' + formattedNumber.substring(1);
    } else {
      formattedNumber = '+91' + formattedNumber;
    }
  }

  if (message) {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedNumber.replace('+', '')}?text=${encodedMessage}`;
  }

  return `https://wa.me/${formattedNumber.replace('+', '')}`;
}

export function openWhatsAppCall(phoneNumber: string) {
  const link = generateWhatsAppLink(phoneNumber);
  window.open(link, '_blank');
}

export function openWhatsAppVoiceCall(phoneNumber: string) {
  const link = generateWhatsAppLink(phoneNumber, "📞 Starting voice call...");
  window.open(link, '_blank');
}

export function openWhatsAppVideoCall(phoneNumber: string) {
  const link = generateWhatsAppLink(phoneNumber, "📹 Starting video call...");
  window.open(link, '_blank');
}

export function openPhoneCall(phoneNumber: string) {
  window.location.href = `tel:${phoneNumber}`;
}

export function openWhatsAppMessage(phoneNumber: string, message: string) {
  const link = generateWhatsAppLink(phoneNumber, message);
  window.open(link, '_blank');
}
