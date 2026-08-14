import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(BASE_DIR, "..", "..", "datasets", "banking77", "banking77_train.csv")

df = pd.read_csv(csv_path)

print("First 5 rows:")
print(df.head())

print("\nColumns:", df.columns.tolist())

print("\nUnique intent labels (numbers):")
print(df['label'].unique())

print("\nTotal number of intents:", df['label'].nunique())
print("Total number of rows:", len(df))