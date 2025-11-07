export async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          resolve([]);
          return;
        }

        // Parse header
        const headers = lines[0].split(",").map((h) => h.trim());

        // Parse records
        const records = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const record: any = {};
          headers.forEach((header, index) => {
            record[header] = values[index] || "";
          });
          return record;
        });

        resolve(records);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
