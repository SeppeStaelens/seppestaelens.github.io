var resizeTimeoutId = null;

function syncNewsSidebarHeight() {
    var aboutMain = document.querySelector('.about-main');
    var sidebar = document.querySelector('.news-sidebar');
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

    var newsPath = window.location.pathname.indexOf('/webpages/') !== -1 ? '../news.yaml' : 'news.yaml';

    fetch(newsPath)
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
            case 'outreach':
                return 'fa-handshake';
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

// Citation count fetcher
document.addEventListener("DOMContentLoaded", () => {
    fetchInspireCitations();
});

async function fetchInspireCitations() {
    // Select any list items that contain either identifier
    const publications = document.querySelectorAll("li[data-doi], li[data-arxiv]");

    publications.forEach(async (pub) => {
        const doi = pub.getAttribute("data-doi");
        const arxiv = pub.getAttribute("data-arxiv");
        const countSpan = pub.querySelector(".js-inspire-count");

        if (!countSpan) return;

        try {
            // Build a flexible query string based on what data is available
            let query = "";
            if (doi) {
                query = `doi:${doi}`;
            } else if (arxiv) {
                query = `arxiv:${arxiv}`;
            } else {
                return;
            }

            // Use the universal search literature endpoint
            const apiUrl = `https://inspirehep.net/api/literature?q=${encodeURIComponent(query)}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            // The search endpoint returns an array of hits inside 'hits.hits'
            const record = data.hits?.hits?.[0];
            const citationCount = record?.metadata?.citation_count;

            if (citationCount !== undefined) {
                countSpan.textContent = citationCount;
            } else {
                countSpan.textContent = "0"; // Record exists, but has 0 citations
            }
        } catch (error) {
            console.error(`Failed to fetch citations for paper:`, error);
            countSpan.textContent = "—"; // Fallback to placeholder if API breaks
        }
    });
}
