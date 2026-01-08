function toggleSection(sectionId) {
    var sections = document.getElementsByTagName('section');
    for (var i = 0; i < sections.length; i++) {
        if (sections[i].id === sectionId) {
            sections[i].classList.remove('hidden');
        } else {
            sections[i].classList.add('hidden');
        }
    }
    if (sectionId === 'about') {
        // sync heights when about is shown
        setTimeout(syncNewsSidebarHeight, 50);
    }
}

var resizeTimeoutId = null;

function syncNewsSidebarHeight() {
    var aboutMain = document.querySelector('#about .about-main');
    var sidebar = document.querySelector('#about .news-sidebar');
    if (!aboutMain || !sidebar) {
        return;
    }

    // On small screens (stacked layout), don't force a height
    if (window.matchMedia('(max-width: 768px)').matches) {
        sidebar.style.height = 'auto';
        sidebar.style.maxHeight = '';
        return;
    }

    // Let CSS max-height control size; ensure auto height for measurement
    sidebar.style.height = 'auto';
    var targetHeight = Math.round(aboutMain.offsetHeight * 0.9);
    var cappedHeight = Math.min(targetHeight, 1200);
    sidebar.style.maxHeight = cappedHeight + 'px';
}

function debouncedSyncHeight() {
    if (resizeTimeoutId) {
        clearTimeout(resizeTimeoutId);
    }
    resizeTimeoutId = setTimeout(function() {
        syncNewsSidebarHeight();
    }, 100);
}

// Based on functions found on Z Shumaylov's GitHub page 
function loadNews() {
    const newsList = document.getElementById('news-list');
    if (!newsList) {
        return;
    }

    fetch('news.yaml')
        .then(function(response) { return response.text(); })
        .then(function(yamlText) {
            var newsItems = [];
            try {
                newsItems = jsyaml.load(yamlText) || [];
            } catch (error) {
                console.error('Error parsing news:', error);
            }
            renderNews(newsItems);
            // After rendering, align sidebar height to main content
            setTimeout(syncNewsSidebarHeight, 80);
        })
        .catch(function(error) {
            console.error('Error fetching news:', error);
            newsList.innerHTML = '<p>Could not load news updates.</p>';
            setTimeout(syncNewsSidebarHeight, 80);
        });
}

function renderNews(newsItems) {
    const newsList = document.getElementById('news-list');
    if (!newsList) {
        return;
    }

    newsList.innerHTML = '';
    if (!Array.isArray(newsItems) || newsItems.length === 0) {
        newsList.innerHTML = '<p>No updates yet. Check back soon.</p>';
        return;
    }

    // Sort most recent first
    newsItems.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    var getIcon = function(type) {
        switch (type) {
            case 'publication':
                return 'fa-scroll';
            case 'talk':
                return 'fa-microphone';
            case 'job':
                return 'fa-briefcase';
            case 'visit':
                return 'fa-plane';
            default:
                return 'fa-circle-info';
        }
    };

    newsItems.forEach(function(item) {
        var date = new Date(item.date);
        var formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        var newsItem = document.createElement('div');
        newsItem.className = 'news-item';

        var linksHTML = '';
        if (item.links && item.links.length > 0) {
            linksHTML = '<div class="news-links">' +
                item.links.map(function(link) {
                    return '<a href="' + link.url + '" class="news-link" target="_blank">' +
                        '<i class="fa-solid fa-up-right-from-square"></i>' + link.text +
                        '</a>';
                }).join('') +
                '</div>';
        }

        newsItem.innerHTML =
            '<div class="news-header">' +
                '<span class="news-icon icon-' + (item.type || 'default') + '">' +
                    '<i class="fa-solid ' + getIcon(item.type) + '"></i>' +
                '</span>' +
                '<div class="news-date">' + formattedDate + '</div>' +
            '</div>' +
            '<div class="news-content">' +
                item.content +
                '<div class="news-meta">' +
                    (item.location ? '<span class="news-location"><i class="fa-solid fa-location-dot"></i> ' + item.location + '</span>' : '') +
                    linksHTML +
                '</div>' +
            '</div>';

        newsList.appendChild(newsItem);
    });
}

document.addEventListener('DOMContentLoaded', function() {
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

    loadNews();

    // Single follow-up after initial render
    setTimeout(syncNewsSidebarHeight, 120);

    // Ensure height syncs after full page load (images, fonts, etc.)
    window.addEventListener('load', function() {
        setTimeout(syncNewsSidebarHeight, 120);
    });

    // Sync after fonts finish loading (to account for reflow)
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function() {
            setTimeout(syncNewsSidebarHeight, 80);
        });
    }
});

// Keep heights in sync on resize
window.addEventListener('resize', debouncedSyncHeight);
