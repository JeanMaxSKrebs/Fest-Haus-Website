export async function getDatasOcupadas(): Promise<string[]> {
  try {
    const response = await fetch("http://localhost:3001/api/google-calendar");

    if (!response.ok) {
      throw new Error("Erro ao buscar Google Calendar");
    }

    const data = await response.json();

    return data.datasOcupadas || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}