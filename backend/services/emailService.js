const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, verificationCode, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Код верификации Comic Con Tickets',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center;">🎬 Comic Con Tickets</h1>
            <h2 style="color: #666; text-align: center;">Код верификации</h2>
            <p style="color: #666; font-size: 16px;">Привет, ${userName}!</p>
            <p style="color: #666; font-size: 16px;">Ваш код верификации для завершения регистрации:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 5px;">${verificationCode}</span>
            </div>
            <p style="color: #999; font-size: 14px;">Код действует 10 минут.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Если это были не вы, просто проигнорируйте это письмо.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    throw error;
  }
};

const sendTicketEmail = async (email, ticketData, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `🎫 Ваш билет на ${ticketData.eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center;">🎬 Comic Con Tickets</h1>
            <h2 style="color: #e74c3c; text-align: center;">Ваш билет приобретен!</h2>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin: 0; font-size: 24px;">${ticketData.eventName}</h3>
              <p style="margin: 10px 0; font-size: 14px;">📅 ${new Date(ticketData.eventDate).toLocaleDateString('ru-RU')}</p>
              <p style="margin: 10px 0; font-size: 14px;">📍 ${ticketData.eventLocation}</p>
            </div>

            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #333;"><strong>Тип билета:</strong> ${ticketData.ticketType}</p>
              <p style="color: #333;"><strong>Количество:</strong> ${ticketData.quantity}</p>
              <p style="color: #333;"><strong>Стоимость:</strong> ${ticketData.price} ₽</p>
              <p style="color: #333;"><strong>Номер билета:</strong> ${ticketData.ticketNumber}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666; font-size: 14px;">Сохраните этот номер билета для входа на событие</p>
            </div>

            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
              Спасибо за покупку билета!
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Ошибка отправки билета по email:', error);
    throw error;
  }
};

module.exports = { sendVerificationEmail, sendTicketEmail };
