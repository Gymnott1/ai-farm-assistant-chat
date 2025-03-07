//https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2
//YOUR_HUGGINGFACE_API_KEYimport 
import React, { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    {
      type: "ai",
      content:
        "Hello! I'm your AI Farm Assistant. Ask me anything about farming in Kenya, or upload a photo of your crops if you need help diagnosing a problem."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("English");


  const suggestions = [
    "What fertilizer for sukuma wiki?",
    "When to plant maize in Maseno?",
    "How to control tomato blight?",
    "Best pesticide for maize?",
    "How often to water kale?"
  ];

  // Fixed farming prompt (resume/instructions)
  const farmingResume = `You are an AI Farm Assistant with deep expertise in Kenyan agriculture. Provide clear, precise, and actionable advice on crop management, pest control, soil fertility, irrigation, and sustainable farming practices. Always consider local conditions and best practices in Kenyan farming. Your answer should not exceed 100 words. Do not give list answers just paragraph and short:\n Question- `;


  // Function to call the Hugging Face API
  const callHuggingFaceAPI = async (userInput) => {
    // Prepend the farming resume and format the prompt
    const fullPrompt = `${farmingResume}\nQuestion- User: ${userInput}\nAnswer:`;
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Replace YOUR_HUGGINGFACE_API_KEY with your actual key
            Authorization: "Bearer YOUR_HUGGINGFACE_API_KEY"
          },
          body: JSON.stringify({ inputs: fullPrompt })
        }
      );
      const result = await response.json();
      let responseText =
        result[0]?.generated_text || "Sorry, I couldn't generate a response.";
      // Extract only the answer part after the "Answer:" marker.
      const answerMarker = "Answer:";
      if (responseText.includes(answerMarker)) {
        responseText = responseText.split(answerMarker)[1].trim();
      }
      return responseText;
    } catch (error) {
      console.error("Error calling Hugging Face API:", error);
      return "Error generating response.";
    }
  };

  const callImageCaptionAPI = async (imageFile) => {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning",
        {
          method: "POST",
          headers: {
            "Content-Type": imageFile.type,
            // Replace YOUR_HUGGINGFACE_API_KEY with your actual key
            Authorization: "Bearer YOUR_HUGGINGFACE_API_KEY"
          },
          body: imageFile
        }
      );
      const result = await response.json();
      return result[0]?.generated_text || "No caption generated.";
    } catch (error) {
      console.error("Error calling image captioning API:", error);
      return "Error generating image caption.";
    }
  };

  const callTextModelAPI = async (prompt) => {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer YOUR_HUGGINGFACE_API_KEY"
          },
          body: JSON.stringify({ inputs: prompt })
        }
      );  
      const result = await response.json();
      let responseText = result[0]?.generated_text || "Sorry, I couldn't generate a response.";
      // Extract answer after the "Answer:" marker if it exists.
      const answerMarker = "Answer:";
      if (responseText.includes(answerMarker)) {
        responseText = responseText.split(answerMarker)[1].trim();
      }
      return responseText;
      
      
    } catch (error) {
      console.error("Error calling text model API:", error);
      return "Error generating response.";
    }
    
    
  };
  
  
  
 
  const handleSend = async () => {
    if (!input.trim()) return;
  
    // Add user's message
    const newUserMsg = { type: "user", content: input };
    setMessages((prev) => [...prev, newUserMsg]);
  
    const currentInput = input;
    setInput("");
    setIsLoading(true);
  
    try {
      // Get AI's English response
      let aiResponse = await callHuggingFaceAPI(currentInput);
      
      // For debugging
      console.log("English response:", aiResponse);
  
      // If language is Swahili, translate the English response
      if (language === "Swahili") {
        console.log("Translating to Swahili...");
        const swahiliResponse = await callSwahiliTranslationAPI(aiResponse);
        console.log("Swahili response:", swahiliResponse);
        aiResponse = swahiliResponse;
      }
  
      // Add the final AI message (English or Swahili) to chat
      const newAiMsg = { type: "ai", content: aiResponse };
      setMessages((prev) => [...prev, newAiMsg]);
    } catch (error) {
      console.error("Error in handleSend:", error);
      setMessages((prev) => [...prev, { type: "ai", content: "Sorry, an error occurred. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending message on Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Fill input when clicking a suggestion chip
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const imageUrl = URL.createObjectURL(file);
    setMessages(prev => [...prev, { type: "user", content: "Uploaded Image", image: imageUrl }]);
  
    setIsLoading(true);
    const caption = await callImageCaptionAPI(file);
    const imagePrompt = `${farmingResume}\nThe user uploaded an image. Description: ${caption}\nAnswer:`;
  
    // AI's English response
    let aiResponse = await callTextModelAPI(imagePrompt);
  
    // Translate if user selected Swahili
    if (language === "Swahili") {
      aiResponse = await callSwahiliTranslationAPI(aiResponse);
    }
  
    setMessages(prev => [...prev, { type: "ai", content: aiResponse }]);
    setIsLoading(false);
  };
  

  const callSwahiliTranslationAPI = async (englishText) => {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-sw",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer YOUR_HUGGINGFACE_API_KEY"
          },
          body: JSON.stringify({
            inputs: englishText
          })
        }
      );
      const result = await response.json();
      
      // The translation model returns an array of objects, each with a 'translation_text' property
      // Check if the result is structured as expected
      if (Array.isArray(result) && result.length > 0) {
        return result[0].translation_text || "Translation failed.";
      } else if (typeof result === 'object' && result.translation_text) {
        // Some models might return a single object instead
        return result.translation_text;
      } else {
        console.error("Unexpected translation response format:", result);
        return "Translation failed. Unexpected response format.";
      }
    } catch (error) {
      console.error("Error translating text:", error);
      return "Error translating text.";
    }
  };
  
  return (
    <div className="App">
      <header>
        <div className="logo">
          <span role="img" aria-label="seedling">
            🌱
          </span>{" "}
          AI Farm Assistant
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <select
          style={{ padding: "0.3rem", borderRadius: "4px", border: "none" }}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <a href="http://127.0.0.1:8000/weather/"></a>
          <option value="English">English</option>
          <option value="Swahili">Swahili</option>
          
        </select>

        </div>
      </header>

      <div className="chat-container">
        <div className="chat-header">
          <h1>Ask Your Farming Questions</h1>
          <p>Get instant answers from AI or upload a photo of your crop for analysis</p>
        </div>

        <div className="suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-chip"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.type === "user" ? "user-message" : "ai-message"}`}
            >
              {msg.type === "ai" && <div className="message-avatar ai-avatar">AI</div>}
              <div className="message-content">
                <p>{msg.content}</p>
                {/* If the message includes an image, display it */}
                {msg.image && (
                  <img src={msg.image} alt="Uploaded" className="uploaded-image" />
                )}
              </div>
              {msg.type === "user" && <div className="message-avatar user-avatar">U</div>}
            </div>
          ))}
          {isLoading && (
            <div className="message ai-message">
              <div className="message-avatar ai-avatar">AI</div>
              <div className="message-content">
                <p>Typing...</p>
              </div>
            </div>
          )}
        </div>


        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your farming question here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <label className="upload-button">
            📷
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
          </label>


          <button onClick={handleSend}>Send</button>
        </div>
      </div>

      <footer>
        <p>© 2025 AI Farm Assistant | Available in: English, Swahili, Kikuyu, Luo, Kalenjin</p>
      </footer>
    </div>
  );
}

export default App;
