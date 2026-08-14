from datasets import load_dataset

dataset = load_dataset(
    "PolyAI/banking77",
    trust_remote_code=True
)

print(dataset)

dataset["train"].to_csv(
    "datasets/banking77_train.csv",
    index=False
)

dataset["test"].to_csv(
    "datasets/banking77_test.csv",
    index=False
)

print("Banking77 downloaded successfully!")