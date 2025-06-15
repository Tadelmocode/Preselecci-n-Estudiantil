// Countdown timer
function updateCountdown() {
    // Fecha de cierre (último día de primavera)
    const endDate = new Date();
    endDate.setMonth(5); // Junio (0-11)
    endDate.setDate(20); // 20 de junio (aproximadamente)
    endDate.setHours(23, 59, 59, 0);
    
    const now = new Date();
    const diff = endDate - now;
    
    if (diff <= 0) {
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('days').textContent = days.toString().padStart(2, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

// Iniciar countdown
updateCountdown();
setInterval(updateCountdown, 1000);

// Validación de formulario
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
            if (checkboxes.length === 0) {
                e.preventDefault();
                alert('Debes seleccionar al menos una materia');
            } else if (checkboxes.length > 2) {
                e.preventDefault();
                alert('Solo puedes seleccionar hasta 2 materias como máximo');
            }
        });
    }
    
    // Filtros de estadísticas
    const sortSelect = document.getElementById('sort-by');
    const searchInput = document.getElementById('search');
    
    if (sortSelect || searchInput) {
        function filterStats() {
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const sortBy = sortSelect ? sortSelect.value : 'name';
            
            const statCards = document.querySelectorAll('.stat-card');
            const cardsArray = Array.from(statCards);
            
            // Filtrar
            cardsArray.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const code = card.querySelector('h3 small').textContent.toLowerCase();
                const matchesSearch = title.includes(searchTerm) || code.includes(searchTerm);
                card.style.display = matchesSearch ? 'block' : 'none';
            });
            
            // Ordenar
            const visibleCards = cardsArray.filter(card => card.style.display !== 'none');
            
            visibleCards.sort((a, b) => {
                const aValue = getSortValue(a, sortBy);
                const bValue = getSortValue(b, sortBy);
                
                if (sortBy === 'name') {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue - aValue;
                }
            });
            
            // Reorganizar en el DOM
            const container = document.querySelector('.stats-container');
            visibleCards.forEach(card => container.appendChild(card));
        }
        
        function getSortValue(card, sortBy) {
            switch (sortBy) {
                case 'name':
                    return card.querySelector('h3').textContent;
                case 'count':
                    return parseInt(card.querySelector('.stat-item span').textContent.split('/')[0]);
                case 'percentage':
                    const percentageText = card.querySelector('.progress-bar span').textContent;
                    return parseInt(percentageText);
                default:
                    return 0;
            }
        }
        
        if (sortSelect) sortSelect.addEventListener('change', filterStats);
        if (searchInput) searchInput.addEventListener('input', filterStats);
    }
});

// Efecto de carga suave
document.addEventListener('DOMContentLoaded', function() {
    document.body.style.opacity = '1';
});