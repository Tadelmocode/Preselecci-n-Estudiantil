document.addEventListener('DOMContentLoaded', function() {
  const checkboxes = document.querySelectorAll('input[name="selectedSubjects"]');
  const form = document.getElementById('preselectionForm');
  const counter = document.getElementById('selectionCounter');

  function updateCounter() {
    const checkedCount = document.querySelectorAll('input[name="selectedSubjects"]:checked').length;
    counter.textContent = `${checkedCount}/2 materias seleccionadas`;
    if (checkedCount === 0) {
      counter.className = 'counter error';
    } else if (checkedCount === 2) {
      counter.className = 'counter warning';
    } else {
      counter.className = 'counter';
    }
  }

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const checkedCount = document.querySelectorAll('input[name="selectedSubjects"]:checked').length;
      updateCounter();
      if (checkedCount > 2) {
        this.checked = false;
        updateCounter();
        alert('Solo puedes seleccionar un máximo de 2 materias');
      }
    });
  });

  form.addEventListener('submit', function(e) {
    const checkedCount = document.querySelectorAll('input[name="selectedSubjects"]:checked').length;
    if (checkedCount === 0) {
      e.preventDefault();
      alert('Debes seleccionar al menos 1 materia');
      return false;
    }
    if (checkedCount > 2) {
      e.preventDefault();
      alert('Solo puedes seleccionar máximo 2 materias');
      return false;
    }
  });

  updateCounter();
});