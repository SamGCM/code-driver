export function getColorById(id: string): string {
    const colors = [
      '#3887be', // Azul
      '#f28cb1', // Rosa
      '#f1f075', // Amarelo
      '#51bbd6', // Turquesa
      '#223b53', // Azul escuro
      '#e55e5e', // Vermelho
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  }