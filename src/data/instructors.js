export const defaultInstructors = [
  'Cabrera',
  'Kouchit',
  'McRoy',
  'Mikesell',
  'Moreno',
  "O'Donnell",
  'Toscano',
  'Wong'
];

export function getInstructors() {
  const stored = localStorage.getItem('toqueworks_instructors');
  return stored ? JSON.parse(stored) : defaultInstructors;
}

export function saveInstructors(instructors) {
  localStorage.setItem('toqueworks_instructors', JSON.stringify(instructors));
}

export function addInstructor(name) {
  const instructors = getInstructors();
  if (!instructors.includes(name)) {
    instructors.push(name);
    saveInstructors(instructors);
  }
  return instructors;
}

export function removeInstructor(name) {
  const instructors = getInstructors().filter(n => n !== name);
  saveInstructors(instructors);
  return instructors;
}
