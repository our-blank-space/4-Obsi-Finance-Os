import google.generativeai as genai
import os

def probar_gemini_api(api_key):
    try:
        # Configuración de la API
        genai.configure(api_key=api_key)
        
        # Selección del modelo
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Realizamos la consulta
        print("Enviando consulta a la IA...")
        response = model.generate_content("Hola, dime un dato curioso sobre la inteligencia artificial en Debian.")
        
        # Imprimimos la respuesta
        print("\n--- Respuesta de la IA ---")
        print(response.text)

    except Exception as e:
        print(f"Error detectado: {e}")

if __name__ == "__main__":
    # ¡Recuerda regenerar tu llave si la expusiste antes!
    MI_API_KEY = "TU_NUEVA_API_KEY_AQUI"
    probar_gemini_api(MI_API_KEY)