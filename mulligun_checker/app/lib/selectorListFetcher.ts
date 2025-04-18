
// DBから対応するデータの取得
export async function fetchSelectorList(url: string) {

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error("Failed to fetch selector list");
    }
    const data = await response.json();
    return data;
}

