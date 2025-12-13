function toggleSection(sectionId) {
    var sections = document.getElementsByTagName('section');
    for (var i = 0; i < sections.length; i++) {
        if (sections[i].id === sectionId) {
            sections[i].classList.remove('hidden');
        } else {
            sections[i].classList.add('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('Immerse25')) {
        toggleSection('Immerse25');
    }
    else if (urlParams.has('Animations')) {
        toggleSection('Animations');
    }
    else if (urlParams.has('CamVision25')) {
        toggleSection('CamVision25');
    }
});
