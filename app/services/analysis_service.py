import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import silhouette_score
from fastapi import UploadFile
import io
import json
import random

import uuid
import os

class AnalysisService:
    async def process_csv(self, file: UploadFile, user: dict, conn):
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = f"app/static/files/{unique_filename}"
        
        # Save file
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        df = pd.read_csv(io.BytesIO(content))
        
        # Basic Preprocessing
        # 1. Handle missing values (simple fill with 0 or mode)
        df = df.fillna(0)
        
        # 2. Encode categorical variables
        label_encoders = {}
        for column in df.select_dtypes(include=['object']).columns:
            if column != 'user_id': # Skip ID
                le = LabelEncoder()
                df[column] = le.fit_transform(df[column].astype(str))
                label_encoders[column] = le
        
        # 3. Select features for clustering (exclude user_id)
        features = df.select_dtypes(include=['number'])
        if 'user_id' in features.columns:
            features = features.drop('user_id', axis=1)
            
        # 4. Scale features
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(features)
        
        # 5. Clustering (Find best K)
        best_k = 3
        best_score = -1
        
        # Limit K search for speed
        for k in range(3, 8):
            if len(df) < k: break
            kmeans = KMeans(n_clusters=k, random_state=42)
            labels = kmeans.fit_predict(scaled_features)
            score = silhouette_score(scaled_features, labels)
            if score > best_score:
                best_score = score
                best_k = k
        
        kmeans = KMeans(n_clusters=best_k, random_state=42)
        df['cluster'] = kmeans.fit_predict(scaled_features)
        
        # 6. Generate Personas (Mocking LLM)
        personas = []
        for i in range(best_k):
            cluster_data = df[df['cluster'] == i]
            size = len(cluster_data)
            
            # Mock generation based on cluster stats
            personas.append({
                "id": i,
                "name": f"Persona Type {i+1}",
                "summary": f"This group represents {size} users with distinct behaviors.",
                "features": cluster_data.mean(numeric_only=True).to_dict(),
                "motivation": "Value for money" if i % 2 == 0 else "Premium quality",
                "risk_signal": "High churn risk" if size < len(df)/best_k else "Loyal",
                "content_preference": "Email newsletters" if i % 2 == 0 else "Social media ads"
            })
            
        result = {
            "clusters": best_k,
            "personas": personas,
            "total_users": len(df)
        }

        # Save to DB
        if user and "sub" in user:
            await conn.execute("""
                INSERT INTO analysis_results (user_id, filename, filelink, result)
                VALUES ($1, $2, $3, $4)
            """, int(user["sub"]), file.filename, f"/static/files/{unique_filename}", json.dumps(result))
            
        return result

    async def simulate_message(self, message: str, personas: list):
        # Mock simulation
        results = []
        for p in personas:
            sentiment = random.choice(["Positive", "Neutral", "Negative"])
            results.append({
                "persona_id": p["id"],
                "reaction": sentiment,
                "reason": f"The message aligns with their motivation: {p.get('motivation', 'Unknown')}",
                "suggestion": "Make it shorter" if sentiment == "Negative" else "Good to go"
            })
        return results
