import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScaleLoader } from 'react-spinners';

const PageSummary = () => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const apikey = process.env.REACT_APP_GOOGLE_API_KEY;

  useEffect(() => {
    const fetchSummary = async () => {
      setSummary('');
      setLoading(true);
      try {
        if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
          throw new Error('Chrome API is not available in this context');
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) {
          throw new Error('No active tab found');
        }

        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.body.innerText,
        });

        if (!result || !result[0] || !result[0].result) {
          throw new Error('Failed to retrieve page content');
        }

        const pageContent = result[0].result;

        const genAI = new GoogleGenerativeAI(apikey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Give a concise summary of the content provided: \n\n ${pageContent}`;
        const aiResult = await model.generateContent(prompt);

        const summary = aiResult.response.text();
        setSummary(summary);
      } catch (err) {
        console.error(err);
        setSummary('Failed to summarize content.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []); // Runs only once when the component is mounted

  return (
    <div className="h-full flex flex-col justify-center items-center backdrop-blur-lg p-4">
      {
        loading ? (
          <div className="flex justify-center items-center">
            <ScaleLoader color="#f54545" />
          </div>
        ) : (
          <p className="p-3 font-bold overflow-x-hidden scrollbar mb-2 text-center">
            {summary.length !== 0 ? summary : "Summarized text will appear here."}
          </p>
        )
      }
    </div>
  );
};

export default PageSummary;
