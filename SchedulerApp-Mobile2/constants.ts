// Mappning från användar-ID till namn
// Används för att visa rätt namn i UI istället för siffror
export const USERS: Record<number, string> = {
  1: 'Alex',
  2: 'Melinda',
  3: 'Ryan',
};

// Mappning från användar-ID till färg
// Varje användare har en unik färg som visas i kalendern och på händelsekort
export const COLORS: Record<number, string> = {
  1: '#6200ee', // Alex — lila
  2: '#03dac6', // Melinda — turkos
  3: '#ff6d00', // Ryan — orange
};

// Svenska veckodagsförkortningar som visas i kalenderrutnätet
// Börjar på måndag enligt svensk standard
export const DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];