import axios from "axios";

/**
 * Script para simular la llegada de un mensaje de Meta al Webhook.
 * Úsalo para probar si el CRM recibe y muestra los mensajes correctamente.
 */

const WEBHOOK_URL = "https://crm.aliminlomasdelmar.com/api/webhooks/meta";
const VERIFY_TOKEN = "alimin_2026";

async function simulateMessage() {
  console.log("🚀 Iniciando simulación de mensaje...");

  const payload = {
    object: "page",
    entry: [
      {
        id: "123456789",
        time: Date.now(),
        messaging: [
          {
            sender: { id: "test_user_123" },
            recipient: { id: "123456789" },
            timestamp: Date.now(),
            message: {
              mid: "mid.test_" + Math.random().toString(36).substring(7),
              text: "Hola! Estoy interesado en los lotes de Lomas del Mar. ¿Me dan info?"
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });
    console.log("✅ Simulación enviada con éxito!");
    console.log("Respuesta del servidor:", response.status, response.data);
    console.log("\n👉 Ahora revisa tu Bandeja de Entrada en el CRM. Deberia aparecer un nuevo chat.");
  } catch (error: any) {
    console.error("❌ Error al simular el mensaje:", error.response?.data || error.message);
  }
}

async function simulateComment() {
    console.log("🚀 Iniciando simulación de comentario...");
  
    const payload = {
      object: "page",
      entry: [
        {
          id: "123456789",
          time: Date.now(),
          changes: [
            {
              field: "feed",
              value: {
                item: "comment",
                verb: "add",
                comment_id: "comment_test_" + Math.random().toString(36).substring(7),
                message: "¿Cual es el precio de los terrenos de 5000m2?",
                from: { id: "test_comment_user_456", name: "Cliente Prueba" }
              }
            }
          ]
        }
      ]
    };
  
    try {
      const response = await axios.post(WEBHOOK_URL, payload, {
        headers: { "Content-Type": "application/json" }
      });
      console.log("✅ Simulación de comentario enviada con éxito!");
      console.log("👉 Revisa la pestaña 'Publicaciones' en el CRM.");
    } catch (error: any) {
      console.error("❌ Error al simular el comentario:", error.response?.data || error.message);
    }
}

// Ejecutar ambas simulaciones
async function run() {
    await simulateMessage();
    setTimeout(simulateComment, 2000);
}

run();
