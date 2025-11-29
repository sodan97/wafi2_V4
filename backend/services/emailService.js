import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Vérifier si les variables d'environnement email sont configurées
      const emailHost = process.env.EMAIL_HOST;
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      if (!emailHost || !emailUser || !emailPass) {
        console.log('⚠️  Email configuration incomplete. Using mock mode.');
        this.isConfigured = false;

        // Mock transporter pour le mode "mock" afin que les appels à sendMail/verify ne plantent pas
        this.transporter = {
          sendMail: async (mailOptions) => {
            console.log('✉️  [MOCK EMAIL] sendMail called with:', {
              to: mailOptions.to,
              subject: mailOptions.subject,
            });
            return {
              messageId: 'mock-message-id',
              accepted: [mailOptions.to],
              envelope: {
                from: mailOptions.from,
                to: [mailOptions.to],
              },
            };
          },
          verify: async () => {
            console.log('🔍 [MOCK EMAIL] verify called');
            return true;
          },
        };

        return;
      }

      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          rejectUnauthorized: false // Pour éviter les problèmes de certificat en développement
        }
      });

      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing email service:', error);
      this.isConfigured = false;
      // En cas d'erreur, fallback en mode mock pour éviter de casser l'app
      this.transporter = {
        sendMail: async (mailOptions) => {
          console.log('✉️  [MOCK EMAIL - ERROR FALLBACK] sendMail called with:', {
            to: mailOptions.to,
            subject: mailOptions.subject,
          });
          return {
            messageId: 'mock-error-fallback-message-id',
            accepted: [mailOptions.to],
            envelope: {
              from: mailOptions.from,
              to: [mailOptions.to],
            },
          };
        },
        verify: async () => {
          console.log('🔍 [MOCK EMAIL - ERROR FALLBACK] verify called');
          return true;
        },
      };
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    // Si l'email n'est pas configuré, simuler l'envoi
    if (!this.isConfigured) {
      console.log('📧 [MOCK EMAIL] Email would be sent:');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Content: ${textContent || this.stripHtml(htmlContent).substring(0, 100)}...`);

      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        messageId: `mock-${Date.now()}`,
        response: 'Email sent in mock mode'
      };
    }

    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'Wafi Shop'} <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(userEmail, firstName, lastName) {
    const subject = `Bienvenue chez ${process.env.EMAIL_FROM_NAME} ! 🎉`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue chez WAFI</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 2.5em;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .welcome-title {
            color: #1f2937;
            font-size: 1.8em;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .highlight {
            background-color: #dbeafe;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
            margin: 20px 0;
          }
          .features {
            list-style: none;
            padding: 0;
          }
          .features li {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .features li:before {
            content: "✅ ";
            margin-right: 10px;
          }
          .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">WAFI</div>
            <h1 class="welcome-title">Bienvenue ${firstName} ! 🎉</h1>
          </div>

          <div class="content">
            <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>

            <p>Nous sommes ravis de vous accueillir dans la famille WAFI ! Votre compte a été créé avec succès.</p>

            <div class="highlight">
              <strong>🎊 Félicitations !</strong> Vous pouvez maintenant profiter de tous nos services et découvrir notre large gamme de produits.
            </div>

            <h3>Ce que vous pouvez faire maintenant :</h3>
            <ul class="features">
              <li>Parcourir notre catalogue de produits</li>
              <li>Ajouter des articles à votre panier</li>
              <li>Passer des commandes en ligne</li>
              <li>Recevoir des notifications pour vos produits favoris</li>
              <li>Suivre l'historique de vos commandes</li>
            </ul>

            <p>Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter. Notre équipe est là pour vous accompagner !</p>
          </div>

          <div class="footer">
            <p>Merci de votre confiance,<br>
            <strong>L'équipe WAFI</strong></p>

            <p>
              📧 Email: ${process.env.EMAIL_USER}<br>
              📱 WhatsApp: ${process.env.VITE_MERCHANT_WHATSAPP_NUMBER || 'Contactez-nous'}
            </p>

            <p><small>Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Bienvenue chez WAFI !

      Bonjour ${firstName} ${lastName},

      Nous sommes ravis de vous accueillir dans la famille WAFI ! Votre compte a été créé avec succès.

      Ce que vous pouvez faire maintenant :
      - Parcourir notre catalogue de produits
      - Ajouter des articles à votre panier
      - Passer des commandes en ligne
      - Recevoir des notifications pour vos produits favoris
      - Suivre l'historique de vos commandes

      Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter.

      Merci de votre confiance,
      L'équipe WAFI

      Email: ${process.env.EMAIL_USER}
    `;

    return await this.sendEmail(userEmail, subject, htmlContent, textContent);
  }

  async sendStockNotificationEmail(userEmail, firstName, productName, productId) {
    const subject = `📦 Bonne nouvelle ! "${productName}" est de nouveau en stock`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Produit en stock</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 2.5em;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
          }
          .notification-title {
            color: #1f2937;
            font-size: 1.8em;
            margin-bottom: 20px;
          }
          .product-highlight {
            background-color: #d1fae5;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #059669;
            margin: 20px 0;
            text-align: center;
          }
          .product-name {
            font-size: 1.3em;
            font-weight: bold;
            color: #065f46;
            margin-bottom: 10px;
          }
          .cta-button {
            display: inline-block;
            background-color: #059669;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
            font-size: 1.1em;
          }
          .urgency-note {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📦 WAFI</div>
            <h1 class="notification-title">Bonne nouvelle ${firstName} ! 🎉</h1>
          </div>

          <div class="content">
            <p>Bonjour <strong>${firstName}</strong>,</p>

            <p>Le produit que vous attendiez est enfin de retour en stock !</p>

            <div class="product-highlight">
              <div class="product-name">"${productName}"</div>
              <p>✅ <strong>Maintenant disponible</strong></p>
            </div>

            <div class="urgency-note">
              <strong>⏰ Ne tardez pas !</strong> Les stocks sont limités et ce produit est très demandé. Commandez dès maintenant pour ne pas le manquer à nouveau.
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}?product=${productId}" class="cta-button">
                🛒 Commander maintenant
              </a>
            </div>

            <p>Vous recevez cette notification car vous aviez manifesté votre intérêt pour ce produit. Si vous ne souhaitez plus recevoir ces notifications, vous pouvez les désactiver dans votre compte.</p>
          </div>

          <div class="footer">
            <p>Merci de votre fidélité,<br>
            <strong>L'équipe WAFI</strong></p>

            <p>
              📧 Email: ${process.env.EMAIL_USER}<br>
              📱 WhatsApp: ${process.env.VITE_MERCHANT_WHATSAPP_NUMBER || 'Contactez-nous'}
            </p>

            <p><small>Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Bonne nouvelle ${firstName} !

      Le produit "${productName}" que vous attendiez est enfin de retour en stock !

      Ne tardez pas ! Les stocks sont limités et ce produit est très demandé.

      Visitez notre site pour commander : ${process.env.FRONTEND_URL || 'http://localhost:5173'}

      Merci de votre fidélité,
      L'équipe WAFI

      Email: ${process.env.EMAIL_USER}
    `;

    return await this.sendEmail(userEmail, subject, htmlContent, textContent);
  }

  // Utilitaire pour supprimer les balises HTML
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Test de connexion
  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Email service connection test failed:', error);
      throw error;
    }
  }
}

export default new EmailService();