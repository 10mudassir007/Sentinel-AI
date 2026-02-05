# Sentinel-AI

Sentinel‑AI is a scalable Python project for automated incident detection in video. It combines motion analysis, object detection, and large language model (LLM) summarization to identify meaningful events in surveillance footage and describe them in natural language.

This project is ideal for applications like:
- Autonomous surveillance analytics
- Smart monitoring systems
- Video summarization pipelines
- Safety and security automation

---

## 🚀 Features

- 🧍 **Motion‑aware processing:** Skips irrelevant frames using adaptive motion scoring.
- 🎯 **Object detection:** Identifies scene objects at points of interest.
- 🧠 **LLM annotation:** Uses LLMs to generate human‑readable descriptions of incidents.
- 🧪 **Configurable evaluation range:** Process subranges of video using start/end percentages.
- 📊 **Structured output:** Returns timestamps, object lists, and text descriptions.

---

## 📁 Repository Structure

```

Sentinel-AI/
├── api/                   
├───── routes.py           
├── core/       
├───── agent.py           
├───── config.py
├───── llm.py
├───── yolo_helpers.py
├── services/       
├───── process_video.py       
├───── video_service.py
├── test/ # Contains Test Videos                  
├── .env.example           
├── main.py                
├── requirements.txt       
└── README.md              

````

---

## 🛠️ Getting Started

### 🧾 Requirements

- Python 3.11+
- OpenCV (`opencv-python`)
- NumPy
- Yolo
- LangChain


Install dependencies:

```bash
pip install -r requirements.txt
````

---

## 🧠 Configure LLM

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your LLM keys:

```
GROQ_API_KEY=your_groq_api_key
```

---

## ▶️ Run an Incident Detection Session

Use the provided CLI in `main.py` (or call functions programmatically):

```bash
uvicorn main:app 
```

Or directly in Python:

---

## 🧪 Test Videos

Put your test MP4s in the `test/` folder (example: `test/car2.mp4`).

Ensure correct file paths when calling functions — either run from project root or use absolute paths.

---

## 📜 License

This project is licensed under the **Apache‑2.0 License**.

---

