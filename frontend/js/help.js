document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('helpSearchInput');
    const clear = document.getElementById('clearHelpSearchButton');
    const trouble = document.getElementById('helpTroubleshootingButton');
    const panel = document.getElementById('helpTroubleshootingPanel');
    const noResults = document.getElementById('helpNoResults');
    const sections = [...document.querySelectorAll('[data-help-section]')];

    function filterHelpTopics(term) {
        let visible = 0;
        sections.forEach(section => {
            const matches = !term || section.textContent.toLowerCase().includes(term);
            section.style.display = matches ? '' : 'none';
            if (matches) visible++;
        });
        if (noResults) noResults.hidden = visible !== 0;
    }

    search?.addEventListener('input', () => filterHelpTopics(search.value.trim().toLowerCase()));
    clear?.addEventListener('click', () => {
        if (search) { search.value = ''; search.focus(); }
        filterHelpTopics('');
    });

    trouble?.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        trouble.innerHTML = panel.hidden
            ? '<i class="bi bi-tools"></i> Troubleshooting'
            : '<i class="bi bi-x-lg"></i> Hide Troubleshooting';
    });

    document.querySelectorAll('.help-quick-card').forEach(button => {
        button.addEventListener('click', () => {
            const target = document.querySelector(`[data-help-section="${button.dataset.helpTarget}"]`);
            if (!target) return;
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.animate(
                [{ transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }],
                { duration: 500 }
            );
        });
    });
});
