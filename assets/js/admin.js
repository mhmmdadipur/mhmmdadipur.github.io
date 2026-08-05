/**
 * Admin.js - Admin Panel Logic with GitHub API Integration + Offline Mode
 * Manages CRUD operations for education, experience, portfolio, and skills
 * Commits changes directly to GitHub repository OR saves locally for testing
 */

(function () {
    'use strict';

    let githubToken = '';
    let repoFullName = '';
    let siteData = null;
    let isOfflineMode = false;

    // ===== LOGIN & GITHUB API =====

    document.getElementById('btn-login').addEventListener('click', async function () {
        const token = document.getElementById('github-token').value.trim();
        const repo = document.getElementById('github-repo').value.trim();
        const errorEl = document.getElementById('login-error');

        if (!token || !repo) {
            showLoginError('Please fill in all fields');
            return;
        }

        errorEl.classList.add('d-none');
        this.disabled = true;
        this.innerHTML = '<i class="ti-reload ti-spin mr-1"></i> Connecting...';

        try {
            // Verify token by fetching repo info
            const response = await githubAPI('GET', `/repos/${repo}`);
            if (!response.ok) {
                throw new Error('Invalid token or repository not found');
            }

            githubToken = token;
            repoFullName = repo;
            isOfflineMode = false;

            // Save to sessionStorage (cleared on browser close)
            sessionStorage.setItem('gh_token', token);
            sessionStorage.setItem('gh_repo', repo);
            sessionStorage.setItem('mode', 'online');

            // Load data.json from repo
            await loadDataFromRepo();

            // Show dashboard
            showDashboard(repo, false);
        } catch (error) {
            showLoginError(error.message);
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="ti-check mr-1"></i> Connect';
        }
    });

    // ===== OFFLINE MODE =====

    document.getElementById('btn-offline').addEventListener('click', async function () {
        this.disabled = true;
        this.innerHTML = '<i class="ti-reload ti-spin mr-1"></i> Loading...';

        try {
            isOfflineMode = true;
            sessionStorage.setItem('mode', 'offline');

            // Try to load from localStorage first, then from data.json file
            const savedData = localStorage.getItem('admin_data_offline');
            if (savedData) {
                siteData = JSON.parse(savedData);
            } else {
                // Load from local data.json
                const response = await fetch('data.json?' + Date.now());
                if (!response.ok) {
                    throw new Error('Cannot load data.json. Make sure the file exists.');
                }
                siteData = await response.json();
            }

            showDashboard('Offline Mode', true);
        } catch (error) {
            showLoginError(error.message);
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="ti-desktop mr-1"></i> Offline Mode (Local Testing)';
        }
    });

    function showDashboard(label, offline) {
        document.getElementById('login-screen').classList.add('d-none');
        document.getElementById('admin-dashboard').classList.remove('d-none');
        document.getElementById('repo-name').textContent = label;

        var badge = document.getElementById('status-badge');
        var saveBtn = document.getElementById('btn-save-all');

        if (offline) {
            badge.textContent = 'Offline';
            badge.className = 'badge badge-warning';
            saveBtn.innerHTML = '<i class="ti-save mr-1"></i> Save Locally';
        } else {
            badge.textContent = 'Connected';
            badge.className = 'badge badge-success';
            saveBtn.innerHTML = '<i class="ti-save mr-1"></i> Save & Push';
        }

        renderAllSections();
    }

    // Check for existing session
    (function checkSession() {
        const token = sessionStorage.getItem('gh_token');
        const repo = sessionStorage.getItem('gh_repo');
        const mode = sessionStorage.getItem('mode');
        if (token && repo) {
            document.getElementById('github-token').value = token;
            document.getElementById('github-repo').value = repo;
        }
    })();

    function showLoginError(msg) {
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = msg;
        errorEl.classList.remove('d-none');
    }

    // GitHub API helper
    async function githubAPI(method, endpoint, body) {
        const options = {
            method: method,
            headers: {
                'Authorization': 'token ' + githubToken,
                'Accept': 'application/vnd.github.v3+json'
            }
        };
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        return fetch('https://api.github.com' + endpoint, options);
    }

    // Load data.json from GitHub repo
    async function loadDataFromRepo() {
        const response = await githubAPI('GET', `/repos/${repoFullName}/contents/data.json`);
        if (!response.ok) {
            throw new Error('data.json not found in repository');
        }
        const fileInfo = await response.json();
        const content = atob(fileInfo.content);
        siteData = JSON.parse(content);
        siteData._sha = fileInfo.sha; // Store SHA for updates
    }

    // Save data.json to GitHub repo
    async function saveDataToRepo() {
        const dataToSave = Object.assign({}, siteData);
        const sha = dataToSave._sha;
        delete dataToSave._sha;

        const content = btoa(unescape(encodeURIComponent(JSON.stringify(dataToSave, null, 2))));

        const response = await githubAPI('PUT', `/repos/${repoFullName}/contents/data.json`, {
            message: 'Update data.json via Admin Panel',
            content: content,
            sha: sha
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save');
        }

        const result = await response.json();
        siteData._sha = result.content.sha; // Update SHA
        return result;
    }

    // Save locally (offline mode)
    function saveDataLocally() {
        const dataToSave = Object.assign({}, siteData);
        delete dataToSave._sha;
        localStorage.setItem('admin_data_offline', JSON.stringify(dataToSave));
    }

    // Save version.json to GitHub
    async function saveVersionJson() {
        var dataToSave = Object.assign({}, changelogData);
        var sha = dataToSave._sha;
        delete dataToSave._sha;

        var content = btoa(unescape(encodeURIComponent(JSON.stringify(dataToSave, null, 2))));
        var body = {
            message: 'Update version.json to v' + (dataToSave.current || siteData.version),
            content: content
        };
        if (sha) body.sha = sha;

        var response = await githubAPI('PUT', '/repos/' + repoFullName + '/contents/version.json', body);
        if (response.ok) {
            var result = await response.json();
            changelogData._sha = result.content.sha;
        }
    }

    // ===== NAVIGATION =====

    document.querySelectorAll('.sidebar-nav .nav-item').forEach(function (item) {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');

            // Update active nav
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(function (n) { n.classList.remove('active'); });
            this.classList.add('active');

            // Show section
            document.querySelectorAll('.content-section').forEach(function (s) { s.classList.remove('active'); });
            document.getElementById('section-' + section).classList.add('active');

            // Close sidebar on mobile
            document.getElementById('admin-dashboard').classList.remove('sidebar-open');
        });
    });

    // Mobile sidebar toggle
    document.getElementById('btn-toggle-sidebar').addEventListener('click', function () {
        document.getElementById('admin-dashboard').classList.toggle('sidebar-open');
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', function () {
        sessionStorage.removeItem('gh_token');
        sessionStorage.removeItem('gh_repo');
        sessionStorage.removeItem('mode');
        githubToken = '';
        repoFullName = '';
        siteData = null;
        isOfflineMode = false;
        document.getElementById('admin-dashboard').classList.add('d-none');
        document.getElementById('login-screen').classList.remove('d-none');

        // Reset badge & button
        document.getElementById('status-badge').textContent = 'Connected';
        document.getElementById('status-badge').className = 'badge badge-success';
        document.getElementById('btn-save-all').innerHTML = '<i class="ti-save mr-1"></i> Save & Push';
    });

    // ===== SAVE ALL =====

    document.getElementById('btn-save-all').addEventListener('click', async function () {
        this.disabled = true;
        var originalText = this.innerHTML;
        this.innerHTML = '<i class="ti-reload ti-spin mr-1"></i> Saving...';

        try {
            // Gather profile data
            updateProfileFromForm();

            // Update version from form
            siteData.version = document.getElementById('version-current').value || siteData.version;

            if (isOfflineMode) {
                saveDataLocally();
                savePendingImagesLocally();
                if (changelogData) {
                    localStorage.setItem('admin_version_offline', JSON.stringify(changelogData));
                }
                showToast('Data saved locally! (localStorage)', 'success');
            } else {
                // Upload pending images first
                await uploadPendingImages();
                await saveDataToRepo();
                if (changelogData) {
                    await saveVersionJson();
                }
                showToast('Data saved and pushed to GitHub!', 'success');
            }
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        } finally {
            this.disabled = false;
            this.innerHTML = originalText;
        }
    });

    // ===== RENDER SECTIONS =====

    function renderAllSections() {
        renderProfileForm();
        renderEducationList();
        renderExperienceList();
        renderPortfolioList();
        renderCertificatesList();
        renderSkillsList();
        renderVersioning();
    }

    // Profile
    function renderProfileForm() {
        if (!siteData) return;
        var p = siteData.profile;
        document.getElementById('profile-name').value = p.name || '';
        var titles = p.subtitles || [p.subtitle || p.title || ''];
        document.getElementById('profile-title').value = titles.join(', ');
        document.getElementById('profile-avatar').value = p.avatar || '';
        // Update avatar preview
        var previewBox = document.getElementById('profile-avatar-preview');
        if (previewBox && p.avatar) {
            previewBox.innerHTML = '<img src="' + escapeHtml(p.avatar) + '" alt="Avatar">';
        }
        document.getElementById('profile-bio').value = p.bio || '';
        document.getElementById('profile-email').value = p.info.email || '';
        document.getElementById('profile-phone').value = p.info.phone || '';
        document.getElementById('profile-address').value = p.info.address || '';
        document.getElementById('profile-dob').value = p.info.dob || '';
        document.getElementById('profile-github').value = p.social.github || '';
        document.getElementById('profile-linkedin').value = p.social.linkedin || '';
        document.getElementById('profile-instagram').value = p.social.instagram || '';
        document.getElementById('profile-twitter').value = p.social.twitter || '';
        document.getElementById('profile-facebook').value = p.social.facebook || '';
        document.getElementById('profile-youtube').value = p.social.youtube || '';
        document.getElementById('profile-cv').value = p.cv_link || '';

        // Setup avatar upload
        setupImageUpload('profile-avatar', 'assets/imgs/avatar.png');
    }

    function updateProfileFromForm() {
        if (!siteData) return;
        siteData.profile.name = document.getElementById('profile-name').value;
        var titlesStr = document.getElementById('profile-title').value;
        siteData.profile.subtitles = titlesStr.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t.length > 0; });
        siteData.profile.subtitle = siteData.profile.subtitles[0] || '';
        siteData.profile.avatar = document.getElementById('profile-avatar').value;
        siteData.profile.bio = document.getElementById('profile-bio').value;
        siteData.profile.info.email = document.getElementById('profile-email').value;
        siteData.profile.info.phone = document.getElementById('profile-phone').value;
        siteData.profile.info.address = document.getElementById('profile-address').value;
        siteData.profile.info.dob = document.getElementById('profile-dob').value;
        siteData.profile.social.github = document.getElementById('profile-github').value;
        siteData.profile.social.linkedin = document.getElementById('profile-linkedin').value;
        siteData.profile.social.instagram = document.getElementById('profile-instagram').value;
        siteData.profile.social.twitter = document.getElementById('profile-twitter').value;
        siteData.profile.social.facebook = document.getElementById('profile-facebook').value;
        siteData.profile.social.youtube = document.getElementById('profile-youtube').value;
        siteData.profile.cv_link = document.getElementById('profile-cv').value;
        siteData.profile.info.name = siteData.profile.name;
    }

    // Education
    function renderEducationList() {
        var container = document.getElementById('education-list');
        if (!siteData || !siteData.education) { container.innerHTML = '<p class="text-muted">No education data</p>'; return; }

        var html = '';
        siteData.education.forEach(function (item, index) {
            html += `
                <div class="item-card">
                    <div class="item-card-body">
                        <h5>${escapeHtml(item.institution)}</h5>
                        <p class="text-muted mb-1">${escapeHtml(item.degree)}</p>
                        <small class="text-muted">${escapeHtml(item.year_start)} - ${escapeHtml(item.year_end)}</small>
                    </div>
                    <div class="item-card-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="AdminApp.editEducation(${index})"><i class="ti-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="AdminApp.deleteEducation(${index})"><i class="ti-trash"></i></button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // Experience
    function renderExperienceList() {
        var container = document.getElementById('experience-list');
        if (!siteData || !siteData.experience) { container.innerHTML = '<p class="text-muted">No experience data</p>'; return; }

        var html = '';
        siteData.experience.forEach(function (item, index) {
            html += `
                <div class="item-card">
                    <div class="item-card-body">
                        <h5>${escapeHtml(item.company)}</h5>
                        <p class="text-muted mb-1">${escapeHtml(item.position)}</p>
                        <small class="text-muted">${escapeHtml(item.period)}</small>
                    </div>
                    <div class="item-card-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="AdminApp.editExperience(${index})"><i class="ti-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="AdminApp.deleteExperience(${index})"><i class="ti-trash"></i></button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // Portfolio
    function renderPortfolioList() {
        var container = document.getElementById('portfolio-list');
        if (!siteData || !siteData.portfolio) { container.innerHTML = '<p class="text-muted">No portfolio data</p>'; return; }

        var html = '';
        siteData.portfolio.forEach(function (item, index) {
            html += `
                <div class="item-card">
                    <div class="item-card-body">
                        <h5>${escapeHtml(item.title)}</h5>
                        <p class="text-muted mb-1">${escapeHtml(item.category)}</p>
                        <small class="text-muted">${escapeHtml(item.description || '')}</small>
                    </div>
                    <div class="item-card-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="AdminApp.editPortfolio(${index})"><i class="ti-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="AdminApp.deletePortfolio(${index})"><i class="ti-trash"></i></button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // Skills
    function renderSkillsList() {
        var container = document.getElementById('skills-list');
        if (!siteData || !siteData.skills) { container.innerHTML = '<p class="text-muted">No skills data</p>'; return; }

        var html = '';
        siteData.skills.forEach(function (item, index) {
            html += `
                <div class="item-card">
                    <div class="item-card-body">
                        <h5>${escapeHtml(item.name)}</h5>
                        <div class="skill-bar-mini">
                            <div class="skill-progress-mini" style="width:${item.level}%"></div>
                        </div>
                        <small class="text-muted">${item.level}%</small>
                    </div>
                    <div class="item-card-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="AdminApp.editSkill(${index})"><i class="ti-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="AdminApp.deleteSkill(${index})"><i class="ti-trash"></i></button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // ===== MODAL FORMS =====

    function openModal() {
        document.getElementById('editModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        document.getElementById('editModal').classList.remove('show');
        document.body.style.overflow = '';
    }

    // Close modal events
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', closeModal);

    function showModal(title, fields, saveCallback) {
        document.getElementById('editModalLabel').textContent = title;
        var body = document.getElementById('modal-body');
        var html = '';

        fields.forEach(function (field) {
            if (field.type === 'textarea') {
                html += `
                    <div class="form-group">
                        <label>${field.label}</label>
                        <textarea class="form-control" id="modal-${field.key}" rows="3">${escapeHtml(field.value || '')}</textarea>
                    </div>
                `;
            } else if (field.type === 'image') {
                html += createImageUploadField('modal-' + field.key, field.label, field.value);
            } else {
                html += `
                    <div class="form-group">
                        <label>${field.label}</label>
                        <input type="${field.type || 'text'}" class="form-control" id="modal-${field.key}" value="${escapeHtml(field.value || '')}">
                    </div>
                `;
            }
        });

        body.innerHTML = html;

        // Setup image upload listeners
        fields.forEach(function (field) {
            if (field.type === 'image') {
                setupImageUpload('modal-' + field.key);
            }
        });

        // Set save handler
        var saveBtn = document.getElementById('btn-modal-save');
        var newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', function () {
            var values = {};
            fields.forEach(function (field) {
                var el = document.getElementById('modal-' + field.key);
                values[field.key] = el ? el.value : '';
            });
            saveCallback(values);
            closeModal();
        });

        openModal();
    }

    // ===== CRUD OPERATIONS =====

    // Education
    function addEducation() {
        showModal('Add Education', [
            { key: 'institution', label: 'Institution', value: '' },
            { key: 'degree', label: 'Degree / Program', value: '' },
            { key: 'year_start', label: 'Year Start', value: '' },
            { key: 'year_end', label: 'Year End', value: '' },
            { key: 'description', label: 'Description', type: 'textarea', value: '' }
        ], function (values) {
            var newId = siteData.education.length > 0 ? Math.max.apply(null, siteData.education.map(function (e) { return e.id; })) + 1 : 1;
            siteData.education.push({
                id: newId,
                institution: values.institution,
                degree: values.degree,
                year_start: values.year_start,
                year_end: values.year_end,
                description: values.description,
                icon: 'assets/imgs/pencil-case.svg'
            });
            renderEducationList();
            showToast('Education added. Click "Save" to persist.', 'info');
        });
    }

    function editEducation(index) {
        var item = siteData.education[index];
        showModal('Edit Education', [
            { key: 'institution', label: 'Institution', value: item.institution },
            { key: 'degree', label: 'Degree / Program', value: item.degree },
            { key: 'year_start', label: 'Year Start', value: item.year_start },
            { key: 'year_end', label: 'Year End', value: item.year_end },
            { key: 'description', label: 'Description', type: 'textarea', value: item.description }
        ], function (values) {
            siteData.education[index].institution = values.institution;
            siteData.education[index].degree = values.degree;
            siteData.education[index].year_start = values.year_start;
            siteData.education[index].year_end = values.year_end;
            siteData.education[index].description = values.description;
            renderEducationList();
            showToast('Education updated. Click "Save" to persist.', 'info');
        });
    }

    function deleteEducation(index) {
        if (confirm('Are you sure you want to delete this education?')) {
            siteData.education.splice(index, 1);
            renderEducationList();
            showToast('Education deleted. Click "Save" to persist.', 'info');
        }
    }

    // Experience
    function addExperience() {
        showModal('Add Experience', [
            { key: 'company', label: 'Company', value: '' },
            { key: 'position', label: 'Position', value: '' },
            { key: 'period', label: 'Period (e.g. Jan 2022 - Dec 2022)', value: '' },
            { key: 'description', label: 'Description', type: 'textarea', value: '' }
        ], function (values) {
            var newId = siteData.experience.length > 0 ? Math.max.apply(null, siteData.experience.map(function (e) { return e.id; })) + 1 : 1;
            siteData.experience.push({
                id: newId,
                company: values.company,
                position: values.position,
                period: values.period,
                description: values.description,
                icon: 'assets/imgs/responsive.svg'
            });
            renderExperienceList();
            showToast('Experience added. Click "Save" to persist.', 'info');
        });
    }

    function editExperience(index) {
        var item = siteData.experience[index];
        showModal('Edit Experience', [
            { key: 'company', label: 'Company', value: item.company },
            { key: 'position', label: 'Position', value: item.position },
            { key: 'period', label: 'Period', value: item.period },
            { key: 'description', label: 'Description', type: 'textarea', value: item.description }
        ], function (values) {
            siteData.experience[index].company = values.company;
            siteData.experience[index].position = values.position;
            siteData.experience[index].period = values.period;
            siteData.experience[index].description = values.description;
            renderExperienceList();
            showToast('Experience updated. Click "Save" to persist.', 'info');
        });
    }

    function deleteExperience(index) {
        if (confirm('Are you sure you want to delete this experience?')) {
            siteData.experience.splice(index, 1);
            renderExperienceList();
            showToast('Experience deleted. Click "Save" to persist.', 'info');
        }
    }

    // Portfolio
    function addPortfolio() {
        showModal('Add Portfolio', [
            { key: 'title', label: 'Title', value: '' },
            { key: 'category', label: 'Category', value: '' },
            { key: 'description', label: 'Description', type: 'textarea', value: '' },
            { key: 'image', label: 'Portfolio Image', type: 'image', value: '' },
            { key: 'link', label: 'Link URL', value: '' }
        ], function (values) {
            var newId = siteData.portfolio.length > 0 ? Math.max.apply(null, siteData.portfolio.map(function (e) { return e.id; })) + 1 : 1;
            siteData.portfolio.push({
                id: newId,
                title: values.title,
                category: values.category,
                description: values.description,
                image: values.image || 'assets/imgs/folio-1.jpg',
                link: values.link
            });
            renderPortfolioList();
            showToast('Portfolio added. Click "Save" to persist.', 'info');
        });
    }

    function editPortfolio(index) {
        var item = siteData.portfolio[index];
        showModal('Edit Portfolio', [
            { key: 'title', label: 'Title', value: item.title },
            { key: 'category', label: 'Category', value: item.category },
            { key: 'description', label: 'Description', type: 'textarea', value: item.description },
            { key: 'image', label: 'Portfolio Image', type: 'image', value: item.image },
            { key: 'link', label: 'Link URL', value: item.link }
        ], function (values) {
            siteData.portfolio[index].title = values.title;
            siteData.portfolio[index].category = values.category;
            siteData.portfolio[index].description = values.description;
            siteData.portfolio[index].image = values.image;
            siteData.portfolio[index].link = values.link;
            renderPortfolioList();
            showToast('Portfolio updated. Click "Save" to persist.', 'info');
        });
    }

    function deletePortfolio(index) {
        if (confirm('Are you sure you want to delete this portfolio item?')) {
            siteData.portfolio.splice(index, 1);
            renderPortfolioList();
            showToast('Portfolio deleted. Click "Save" to persist.', 'info');
        }
    }

    // Skills
    function addSkill() {
        showModal('Add Skill', [
            { key: 'name', label: 'Skill Name', value: '' },
            { key: 'level', label: 'Level (0-100)', type: 'number', value: '75' }
        ], function (values) {
            siteData.skills.push({
                name: values.name,
                level: parseInt(values.level) || 75
            });
            renderSkillsList();
            showToast('Skill added. Click "Save" to persist.', 'info');
        });
    }

    function editSkill(index) {
        var item = siteData.skills[index];
        showModal('Edit Skill', [
            { key: 'name', label: 'Skill Name', value: item.name },
            { key: 'level', label: 'Level (0-100)', type: 'number', value: item.level.toString() }
        ], function (values) {
            siteData.skills[index].name = values.name;
            siteData.skills[index].level = parseInt(values.level) || 75;
            renderSkillsList();
            showToast('Skill updated. Click "Save" to persist.', 'info');
        });
    }

    function deleteSkill(index) {
        if (confirm('Are you sure you want to delete this skill?')) {
            siteData.skills.splice(index, 1);
            renderSkillsList();
            showToast('Skill deleted. Click "Save" to persist.', 'info');
        }
    }

    // ===== ADD BUTTONS =====

    document.getElementById('btn-add-education').addEventListener('click', addEducation);
    document.getElementById('btn-add-experience').addEventListener('click', addExperience);
    document.getElementById('btn-add-portfolio').addEventListener('click', addPortfolio);
    document.getElementById('btn-add-skill').addEventListener('click', addSkill);
    document.getElementById('btn-add-certificate').addEventListener('click', addCertificate);

    // ===== CERTIFICATES CRUD =====

    function renderCertificatesList() {
        var container = document.getElementById('certificates-list');
        if (!siteData || !siteData.certificates) { container.innerHTML = '<p class="text-muted">No certificates data</p>'; return; }

        var html = '';
        siteData.certificates.forEach(function (item, index) {
            html += `
                <div class="item-card">
                    <div class="item-card-body">
                        <h5>${escapeHtml(item.title)}</h5>
                        <p class="text-muted mb-1">${escapeHtml(item.issuer)}</p>
                        <small class="text-muted">${escapeHtml(item.date)}</small>
                    </div>
                    <div class="item-card-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="AdminApp.editCertificate(${index})"><i class="ti-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="AdminApp.deleteCertificate(${index})"><i class="ti-trash"></i></button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    function addCertificate() {
        showModal('Add Certificate', [
            { key: 'title', label: 'Certificate Title', value: '' },
            { key: 'issuer', label: 'Issuer / Organization', value: '' },
            { key: 'date', label: 'Date', value: '' },
            { key: 'image', label: 'Certificate Image', type: 'image', value: '' },
            { key: 'verify_link', label: 'Verification Link', value: '' }
        ], function (values) {
            if (!siteData.certificates) siteData.certificates = [];
            var newId = siteData.certificates.length > 0 ? Math.max.apply(null, siteData.certificates.map(function (e) { return e.id; })) + 1 : 1;
            siteData.certificates.push({
                id: newId,
                title: values.title,
                issuer: values.issuer,
                date: values.date,
                image: values.image || 'assets/imgs/folio-1.jpg',
                verify_link: values.verify_link
            });
            renderCertificatesList();
            showToast('Certificate added. Click "Save" to persist.', 'info');
        });
    }

    function editCertificate(index) {
        var item = siteData.certificates[index];
        showModal('Edit Certificate', [
            { key: 'title', label: 'Certificate Title', value: item.title },
            { key: 'issuer', label: 'Issuer / Organization', value: item.issuer },
            { key: 'date', label: 'Date', value: item.date },
            { key: 'image', label: 'Certificate Image', type: 'image', value: item.image },
            { key: 'verify_link', label: 'Verification Link', value: item.verify_link }
        ], function (values) {
            siteData.certificates[index].title = values.title;
            siteData.certificates[index].issuer = values.issuer;
            siteData.certificates[index].date = values.date;
            siteData.certificates[index].image = values.image;
            siteData.certificates[index].verify_link = values.verify_link;
            renderCertificatesList();
            showToast('Certificate updated. Click "Save" to persist.', 'info');
        });
    }

    function deleteCertificate(index) {
        if (confirm('Are you sure you want to delete this certificate?')) {
            siteData.certificates.splice(index, 1);
            renderCertificatesList();
            showToast('Certificate deleted. Click "Save" to persist.', 'info');
        }
    }

    // ===== VERSIONING =====

    function renderVersioning() {
        if (!siteData) return;
        var version = siteData.version || '1.0.0';
        document.getElementById('version-current').value = version;
        document.getElementById('version-display').textContent = 'v' + version;

        // Render changelog from version.json (loaded separately)
        loadChangelog();
    }

    var changelogData = null;

    async function loadChangelog() {
        try {
            var response;
            if (isOfflineMode) {
                response = await fetch('version.json?' + Date.now());
            } else {
                var apiResp = await githubAPI('GET', '/repos/' + repoFullName + '/contents/version.json');
                if (apiResp.ok) {
                    var fileInfo = await apiResp.json();
                    var content = atob(fileInfo.content);
                    changelogData = JSON.parse(content);
                    changelogData._sha = fileInfo.sha;
                    renderChangelog();
                    return;
                }
                // Fallback: create new version.json
                changelogData = { current: siteData.version || '1.0.0', released: new Date().toISOString().split('T')[0], changelog: [] };
                renderChangelog();
                return;
            }
            if (response && response.ok) {
                changelogData = await response.json();
            } else {
                changelogData = { current: siteData.version || '1.0.0', released: new Date().toISOString().split('T')[0], changelog: [] };
            }
            renderChangelog();
        } catch (e) {
            changelogData = { current: siteData.version || '1.0.0', released: new Date().toISOString().split('T')[0], changelog: [] };
            renderChangelog();
        }
    }

    function renderChangelog() {
        var container = document.getElementById('changelog-list');
        if (!container || !changelogData || !changelogData.changelog) { return; }

        if (changelogData.changelog.length === 0) {
            container.innerHTML = '<p class="text-muted">No changelog entries yet</p>';
            return;
        }

        var html = '';
        changelogData.changelog.forEach(function (entry) {
            html += '<div class="item-card"><div class="item-card-body">';
            html += '<h5>v' + escapeHtml(entry.version) + ' <small class="text-muted">(' + escapeHtml(entry.date) + ')</small></h5>';
            html += '<ul class="changelog-changes">';
            entry.changes.forEach(function (change) {
                html += '<li>' + escapeHtml(change) + '</li>';
            });
            html += '</ul></div></div>';
        });
        container.innerHTML = html;
    }

    function bumpVersion(type) {
        var current = document.getElementById('version-current').value || '1.0.0';
        var parts = current.split('.').map(Number);
        if (parts.length !== 3) parts = [1, 0, 0];

        if (type === 'major') { parts[0]++; parts[1] = 0; parts[2] = 0; }
        else if (type === 'minor') { parts[1]++; parts[2] = 0; }
        else { parts[2]++; }

        var newVersion = parts.join('.');
        document.getElementById('version-current').value = newVersion;
        siteData.version = newVersion;
        document.getElementById('version-display').textContent = 'v' + newVersion;

        // Add changelog entry
        var notes = document.getElementById('version-notes').value.trim();
        if (notes) {
            var changes = notes.split('\n').filter(function (l) { return l.trim().length > 0; });
            if (!changelogData) changelogData = { current: newVersion, changelog: [] };
            changelogData.changelog.unshift({
                version: newVersion,
                date: new Date().toISOString().split('T')[0],
                changes: changes
            });
            changelogData.current = newVersion;
            changelogData.released = new Date().toISOString().split('T')[0];
            document.getElementById('version-notes').value = '';
            renderChangelog();
        }

        showToast('Version bumped to ' + newVersion + '. Click "Save" to persist.', 'info');
    }

    document.getElementById('btn-bump-patch').addEventListener('click', function () { bumpVersion('patch'); });
    document.getElementById('btn-bump-minor').addEventListener('click', function () { bumpVersion('minor'); });
    document.getElementById('btn-bump-major').addEventListener('click', function () { bumpVersion('major'); });

    // ===== AUTO-HIDE OFFLINE BUTTON ON PRODUCTION =====
    (function hideOfflineOnProduction() {
        var host = window.location.hostname;
        if (host.indexOf('github.io') !== -1) {
            var offlineBtn = document.getElementById('btn-offline');
            var divider = document.getElementById('divider-offline');
            var hint = document.getElementById('offline-hint');
            if (offlineBtn) offlineBtn.style.display = 'none';
            if (divider) divider.style.display = 'none';
            if (hint) hint.style.display = 'none';
        }
    })();

    // ===== IMAGE UPLOAD VIA GITHUB API =====

    var MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
    var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    function createImageUploadField(fieldId, label, currentValue) {
        return `
            <div class="form-group">
                <label>${label}</label>
                <div class="image-upload-wrapper">
                    <div class="image-preview-box" id="${fieldId}-preview">
                        ${currentValue ? `<img src="${escapeHtml(currentValue)}" alt="Preview">` : '<span>No image</span>'}
                    </div>
                    <div class="image-upload-actions">
                        <input type="file" id="${fieldId}-file" accept="image/jpeg,image/png,image/webp,image/gif" class="d-none">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="document.getElementById('${fieldId}-file').click()">
                            <i class="ti-upload mr-1"></i> Upload Image
                        </button>
                        <input type="text" class="form-control mt-2" id="${fieldId}" value="${escapeHtml(currentValue || '')}" placeholder="assets/imgs/filename.jpg">
                        <small class="form-text text-muted">Max 2MB. JPG, PNG, WebP, GIF.</small>
                    </div>
                </div>
            </div>
        `;
    }

    // Handle image upload for a specific field
    function setupImageUpload(fieldId, targetPath) {
        var fileInput = document.getElementById(fieldId + '-file');
        if (!fileInput) return;

        fileInput.addEventListener('change', function () {
            var file = this.files[0];
            if (!file) return;

            // Validate type
            if (ALLOWED_TYPES.indexOf(file.type) === -1) {
                showToast('Invalid file type. Use JPG, PNG, WebP or GIF.', 'error');
                this.value = '';
                return;
            }

            // Validate size
            if (file.size > MAX_IMAGE_SIZE) {
                showToast('File too large. Maximum 2MB allowed. Your file: ' + (file.size / 1024 / 1024).toFixed(2) + 'MB', 'error');
                this.value = '';
                return;
            }

            // Read file and show preview
            var reader = new FileReader();
            reader.onload = function (e) {
                var previewBox = document.getElementById(fieldId + '-preview');
                if (previewBox) {
                    previewBox.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
                }

                // Determine file path
                var ext = file.name.split('.').pop().toLowerCase();
                var fileName = targetPath || ('assets/imgs/' + fieldId.replace('modal-', '') + '-' + Date.now() + '.' + ext);

                // Store the base64 data for upload on save
                var base64Data = e.target.result.split(',')[1];
                window._pendingUploads = window._pendingUploads || {};
                window._pendingUploads[fieldId] = {
                    path: fileName,
                    content: base64Data,
                    fileName: file.name
                };

                // Update the text field
                var pathInput = document.getElementById(fieldId);
                if (pathInput) pathInput.value = fileName;

                showToast('Image ready. Will be uploaded on save.', 'info');
            };
            reader.readAsDataURL(file);
        });
    }

    // Upload all pending images to GitHub
    async function uploadPendingImages() {
        if (!window._pendingUploads) return;

        var uploads = Object.keys(window._pendingUploads);
        for (var i = 0; i < uploads.length; i++) {
            var upload = window._pendingUploads[uploads[i]];
            try {
                // Check if file exists (to get SHA for replace)
                var checkResp = await githubAPI('GET', '/repos/' + repoFullName + '/contents/' + upload.path);
                var body = {
                    message: 'Upload image: ' + upload.path,
                    content: upload.content
                };
                if (checkResp.ok) {
                    var existing = await checkResp.json();
                    body.sha = existing.sha; // Replace existing file
                }
                await githubAPI('PUT', '/repos/' + repoFullName + '/contents/' + upload.path, body);
            } catch (e) {
                showToast('Failed to upload: ' + upload.path, 'error');
            }
        }
        window._pendingUploads = {};
    }

    // Save pending images locally (offline mode)
    function savePendingImagesLocally() {
        // In offline mode, images can't really be saved - just update paths
        window._pendingUploads = {};
    }

    // ===== UTILITY =====

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    function showToast(message, type) {
        var toast = document.getElementById('toast');
        var msg = document.getElementById('toast-message');
        toast.className = 'toast-notification toast-' + (type || 'info');
        msg.textContent = message;
        toast.classList.remove('d-none');

        setTimeout(function () {
            toast.classList.add('d-none');
        }, 4000);
    }

    // ===== EXPOSE GLOBAL API =====
    window.AdminApp = {
        editEducation: editEducation,
        deleteEducation: deleteEducation,
        editExperience: editExperience,
        deleteExperience: deleteExperience,
        editPortfolio: editPortfolio,
        deletePortfolio: deletePortfolio,
        editSkill: editSkill,
        deleteSkill: deleteSkill,
        editCertificate: editCertificate,
        deleteCertificate: deleteCertificate
    };

})();
