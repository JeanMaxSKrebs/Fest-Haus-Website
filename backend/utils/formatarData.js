export function formatarDataPtBR(dataISO) {
    if (!dataISO) return "Data não informada";

    const data = new Date(dataISO);

    if (Number.isNaN(data.getTime())) {
        return "Data não informada";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(data);
}