const month = 3;
const year = 2026;
const Smonth = String(month).padStart(2, '0');
const endDay = new Date(year, month, 0).getDate();
const f1 = new Date(`${year}-${Smonth}-01T00:00:00.000-06:00`);
const f2 = new Date(`${year}-${Smonth}-${endDay}T23:59:59.999-06:00`);
console.log(f1.toISOString(), f2.toISOString(), 'success!');

const f3 = new Date(`${year}-${Smonth}-15T23:59:59.999-06:00`);
console.log(f3.toISOString(), 'success half month!');
