/**
 * App.js - Load data.json and render content dynamically
 */

(function () {
    'use strict';

    // Load data from JSON
    async function loadData() {
        try {
            const response = await fetch('data.json?' + Date.now());
            if (!response.ok) throw new Error('Failed to load data');
            const data = await response.json();
            renderAll(data);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    // Render all sections
    function renderAll(data) {
        renderHeader(data.profile);
        renderAbout(data.profile);
        renderSkills(data.skills);
        renderEducation(data.education);
        renderExperience(data.experience);
        renderPortfolio(data.portfolio);
        renderCertificates(data.certificates);
        renderContact(data.profile);
        renderVersion(data.version);
    }

    // Render header
    function renderHeader(profile) {
        const nameEl = document.getElementById('header-name');
        const titleEl = document.getElementById('header-title');
        const btnEmail = document.getElementById('btn-email');
        const btnCv = document.getElementById('btn-cv');
        const btnHire = document.getElementById('btn-hire');

        if (nameEl) {
            // Strip common prefixes: Muhammad and all variants
            var displayName = profile.name.replace(/^(muhammad|muhamad|mohamad|mohammad|mohammed|mochammad|mochamad)\s+/i, '');
            displayName = displayName.replace(/^(moch|muh|moh|m)\.\s*/i, '');
            nameEl.textContent = displayName;
        }

        // Handle multiple subtitles with rotation
        if (titleEl) {
            var subtitles = profile.subtitles || [profile.subtitle || profile.title];
            if (subtitles.length > 1) {
                startTypingEffect(titleEl, subtitles);
            } else {
                titleEl.textContent = subtitles[0];
            }
        }

        if (btnEmail) {
            btnEmail.onclick = function () {
                window.open('mailto:' + profile.info.email, '_blank');
            };
        }
        if (btnCv) {
            btnCv.onclick = function () {
                window.open(profile.cv_link, '_blank');
            };
        }
        if (btnHire) {
            btnHire.onclick = function () {
                window.open(profile.social.whatsapp, '_blank');
            };
        }
    }

    // Render about section
    function renderAbout(profile) {
        const avatar = document.getElementById('about-avatar');
        const bio = document.getElementById('about-bio');
        const infoList = document.getElementById('about-info-list');
        const socialLinks = document.getElementById('social-links');

        if (avatar) avatar.src = profile.avatar;
        if (bio) bio.textContent = profile.bio;

        if (infoList) {
            const info = profile.info;
            infoList.innerHTML = `
                <li class="d-flex"><span>Name:</span> ${info.name}</li>
                <li class="d-flex"><span>Date of birth:</span> <span>${info.dob}</span></li>
                <li class="d-flex"><span>Address:</span> <span>${info.address}</span></li>
                <li class="d-flex"><span>Zip code:</span> <span>${info.zip}</span></li>
                <li class="d-flex"><span>Email:</span> <span>${info.email}</span></li>
                <li class="d-flex"><span>Phone:</span> <span>${info.phone}</span></li>
            `;
        }

        if (socialLinks) {
            let html = '';
            if (profile.cv_link) {
                html += `<button class="btn-rounded btn btn-outline-primary mt-3 mr-2" onclick="window.open('${profile.cv_link}','_blank')"><i class="ti-download mr-1"></i> Download CV</button>`;
            }
            if (profile.social.github) {
                html += `<button class="btn-rounded btn btn-outline-primary2 mt-3 mr-2" onclick="window.open('${profile.social.github}','_blank')"><i class="ti-github"></i></button>`;
            }
            if (profile.social.linkedin) {
                html += `<button class="btn-rounded btn btn-outline-primary2 mt-3 mr-2" onclick="window.open('${profile.social.linkedin}','_blank')"><i class="ti-linkedin"></i></button>`;
            }
            if (profile.social.instagram) {
                html += `<button class="btn-rounded btn btn-outline-primary2 mt-3 mr-2" onclick="window.open('${profile.social.instagram}','_blank')"><i class="ti-instagram"></i></button>`;
            }
            if (profile.social.twitter) {
                html += `<button class="btn-rounded btn btn-outline-primary2 mt-3 mr-2" onclick="window.open('${profile.social.twitter}','_blank')"><i class="ti-twitter"></i></button>`;
            }
            if (profile.social.facebook) {
                html += `<button class="btn-rounded btn btn-outline-primary2 mt-3 mr-2" onclick="window.open('${profile.social.facebook}','_blank')"><i class="ti-facebook"></i></button>`;
            }
            if (profile.social.youtube) {
                html += `<button class="btn-rounded btn btn-outline-primary2 mt-3 mr-2" onclick="window.open('${profile.social.youtube}','_blank')"><i class="ti-youtube"></i></button>`;
            }
            socialLinks.innerHTML = html;
        }
    }

    // Render skills
    function renderSkills(skills) {
        const container = document.getElementById('skills-container');
        if (!container || !skills) return;

        let html = '';
        skills.forEach(function (skill) {
            html += `
                <div class="col-md-6 mb-4">
                    <div class="skill-item">
                        <div class="skill-header">
                            <span class="skill-name">${escapeHtml(skill.name)}</span>
                            <span class="skill-percentage">${skill.level}%</span>
                        </div>
                        <div class="skill-bar">
                            <div class="skill-progress" style="width: ${skill.level}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // Render education
    function renderEducation(education) {
        const container = document.getElementById('education-container');
        if (!container || !education) return;

        let html = '';
        education.forEach(function (item) {
            html += `
                <div class="col-md-6 mb-4">
                    <div class="service-card">
                        <div class="body my-auto">
                            <img src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.institution)}" class="icon">
                            <h6 class="card-title">${escapeHtml(item.institution)}</h6>
                            <span class="position">${escapeHtml(item.degree)}</span>
                            <span class="period">${escapeHtml(item.year_start)} - ${escapeHtml(item.year_end)}</span>
                            <p class="subtitle">${escapeHtml(item.description)}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // Render experience with pagination
    function renderExperience(experience) {
        const container = document.getElementById('experience-container');
        if (!container || !experience) return;

        var limit = 4;

        function renderItems(count) {
            let html = '';
            for (var i = 0; i < count && i < experience.length; i++) {
                var item = experience[i];
                html += `
                    <div class="col-md-6 mb-4">
                        <div class="service-card">
                            <div class="body my-auto">
                                <img src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.company)}" class="icon">
                                <h6 class="card-title">${escapeHtml(item.company)}</h6>
                                <span class="position">${escapeHtml(item.position)}</span>
                                <span class="period">${escapeHtml(item.period)}</span>
                                <p class="subtitle">${escapeHtml(item.description)}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            if (count < experience.length) {
                html += `<div class="col-12 text-center mt-3"><button class="btn btn-outline-primary btn-rounded btn-load-more" data-section="experience">Load More (${experience.length - count} remaining)</button></div>`;
            }
            container.innerHTML = html;
        }

        renderItems(Math.min(limit, experience.length));

        container.addEventListener('click', function (e) {
            var btn = e.target.closest('.btn-load-more');
            if (btn && btn.dataset.section === 'experience') {
                renderItems(experience.length);
            }
        });
    }

    // Render portfolio with pagination
    function renderPortfolio(portfolio) {
        const container = document.getElementById('portfolio-container');
        if (!container || !portfolio) return;

        var limit = 6;
        var showing = Math.min(limit, portfolio.length);

        function renderItems(count) {
            let html = '';
            for (var i = 0; i < count && i < portfolio.length; i++) {
                var item = portfolio[i];
                html += `
                    <div class="col-md-4 mb-4">
                        <a href="${escapeHtml(item.link)}" class="portfolio-card" target="_blank" rel="noopener noreferrer">
                            <img src="${escapeHtml(item.image)}" class="portfolio-card-img" alt="${escapeHtml(item.title)}">
                            <span class="portfolio-card-overlay">
                                <span class="portfolio-card-caption">
                                    <h4>${escapeHtml(item.title)}</h4>
                                    <p class="font-weight-normal">Category: ${escapeHtml(item.category)}</p>
                                </span>
                            </span>
                        </a>
                    </div>
                `;
            }
            if (count < portfolio.length) {
                html += `<div class="col-12 text-center mt-3"><button class="btn btn-outline-primary btn-rounded btn-load-more" data-section="portfolio">Load More (${portfolio.length - count} remaining)</button></div>`;
            }
            container.innerHTML = html;
        }

        renderItems(showing);

        // Delegate click for load more
        container.addEventListener('click', function (e) {
            var btn = e.target.closest('.btn-load-more');
            if (btn && btn.dataset.section === 'portfolio') {
                renderItems(portfolio.length);
            }
        });
    }

    // Render certificates with pagination
    function renderCertificates(certificates) {
        const container = document.getElementById('certificates-container');
        if (!container || !certificates || certificates.length === 0) {
            if (container) container.innerHTML = '<p class="text-muted">No certificates yet</p>';
            return;
        }

        var limit = 6;

        function renderItems(count) {
            let html = '';
            for (var i = 0; i < count && i < certificates.length; i++) {
                var item = certificates[i];
                html += `
                    <div class="col-md-4 mb-4">
                        <div class="certificate-card">
                            <div class="certificate-img-holder img-protect">
                                <img src="${escapeHtml(item.image)}" class="certificate-img no-save" alt="${escapeHtml(item.title)}" draggable="false">
                                <div class="img-protect-overlay"></div>
                            </div>
                            <div class="certificate-body">
                                <h5 class="certificate-title">${escapeHtml(item.title)}</h5>
                                <p class="certificate-issuer">${escapeHtml(item.issuer)}</p>
                                <small class="text-muted">${escapeHtml(item.date)}</small>
                                ${item.verify_link ? `<a href="${escapeHtml(item.verify_link)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary mt-3 d-block"><i class="ti-check mr-1"></i>Verify</a>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }
            if (count < certificates.length) {
                html += `<div class="col-12 text-center mt-3"><button class="btn btn-outline-primary btn-rounded btn-load-more" data-section="certificates">Load More (${certificates.length - count} remaining)</button></div>`;
            }
            container.innerHTML = html;
        }

        renderItems(Math.min(limit, certificates.length));

        container.addEventListener('click', function (e) {
            var btn = e.target.closest('.btn-load-more');
            if (btn && btn.dataset.section === 'certificates') {
                renderItems(certificates.length);
            }
        });
    }

    // Typing effect for multiple subtitles/roles
    function startTypingEffect(element, texts) {
        var textIndex = 0;
        var charIndex = 0;
        var isDeleting = false;
        var typingSpeed = 100;

        function type() {
            var currentText = texts[textIndex];

            if (isDeleting) {
                element.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 50;
            } else {
                element.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 100;
            }

            if (!isDeleting && charIndex === currentText.length) {
                // Pause at end of word
                typingSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                typingSpeed = 500;
            }

            setTimeout(type, typingSpeed);
        }

        type();
    }

    // Render contact
    function renderContact(profile) {
        const address = document.getElementById('contact-address');
        const phone = document.getElementById('contact-phone');
        const email = document.getElementById('contact-email');
        const linkedin = document.getElementById('contact-linkedin');

        if (address) address.textContent = profile.info.address;
        if (phone) {
            phone.textContent = profile.info.phone;
            phone.href = 'https://wa.me/' + profile.info.phone.replace(/[^0-9+]/g, '');
        }
        if (email) {
            email.textContent = profile.info.email;
            email.href = 'mailto:' + profile.info.email;
        }
        if (linkedin && profile.social.linkedin) {
            linkedin.href = profile.social.linkedin;
        }
    }

    // Utility: escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // Render version
    function renderVersion(version) {
        var badge = document.getElementById('version-badge');
        if (badge && version) {
            badge.textContent = 'v' + version;
        }
    }

    // Init
    document.addEventListener('DOMContentLoaded', loadData);
})();
