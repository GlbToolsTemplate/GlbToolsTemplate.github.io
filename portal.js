console.log('portal.js loaded');

async function loadConfig() {
    if (!window.config) {
        try {
            const response = await fetch('config.json');
            if (!response.ok) throw new Error(`Failed to fetch config.json: ${response.status} ${response.statusText}`);
            window.config = await response.json();
            console.log('Config loaded successfully:', window.config);
        } catch (error) {
            console.error('Config load error:', error);
            showNotification(`Error loading config: ${error.message}. Using fallback.`, true);
            window.config = { siteTitle: 'CLONE.TOOLS' };
        }
    }
    document.querySelector('.logo').textContent = window.config.siteTitle || 'CLONE.TOOLS';
    document.getElementById('dynamic-title').textContent = window.config.siteTitle || 'CLONE.TOOLS'; // Dynamic title
}

const loginBtn = document.getElementById('login-btn');
const uploadForm = document.getElementById('upload-form');
const glbFileInput = document.getElementById('glb-file');
const txtFileInput = document.getElementById('txt-file');
const pngFileInput = document.getElementById('png-file');
const glbDropZone = document.getElementById('glb-drop-zone');
const txtDropZone = document.getElementById('txt-drop-zone');
const pngDropZone = document.getElementById('png-drop-zone');
const loginMessage = document.getElementById('login-message');
const uploadSection = document.getElementById('upload-section');
const profileSection = document.getElementById('profile-section');
const modelSection = document.getElementById('model-section');
const profileLinksSection = document.getElementById('profile-links-section');
const repoList = document.getElementById('repo-list');
const repoStatus = document.getElementById('repo-status');
const refreshReposBtn = document.getElementById('refresh-repos');
const modelList = document.getElementById('model-list');
const modelStatus = document.getElementById('model-status');
const enableCreatorLinksBtn = document.getElementById('enable-creator-links');
const creatorLinksDisclaimer = document.getElementById('creator-links-disclaimer');
const linksForm = document.getElementById('links-form');
const websiteLinkInput = document.getElementById('website-link');
const xLinkInput = document.getElementById('x-link');
const donationLinkInput = document.getElementById('donation-link');
const saveLinksBtn = document.getElementById('save-links');
const configForm = document.getElementById('config-form');
const glbRepoOwnerInput = document.getElementById('glb-repo-owner');
const glbRepoNameInput = document.getElementById('glb-repo-name');
const siteTitleInput = document.getElementById('site-title');
const siteRepoOwnerInput = document.getElementById('site-repo-owner');
const websiteRepoNameInput = document.getElementById('website-repo-name');
const thumbnailFileInput = document.getElementById('thumbnail-file');
const thumbnailDropZone = document.getElementById('thumbnail-drop-zone');
const saveConfigBtn = document.getElementById('save-config');
const profileStatus = document.getElementById('profile-status');
const publishLabel = document.getElementById('publish-label');
const publishToggleBtn = document.getElementById('publish-toggle-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const myPortalLink = document.getElementById('my-portal-link');
const logoutBtn = document.getElementById('logout-btn');
const bulkToggle = document.getElementById('bulk-toggle');
let username;

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    if (isError) notification.classList.add('error');
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 5000);
}

async function checkSession() {
    await loadConfig();
    let dropdownVisible = false;

    auth.checkSession(async (user) => {
        if (user && auth.getToken()) {
            try {
                const response = await fetch('https://api.github.com/user', {
                    headers: { 'Authorization': `token ${auth.getToken()}` }
                });
                if (!response.ok) throw new Error('Failed to fetch user');
                const userData = await response.json();
                username = userData.login;

                if (username === window.config.glbRepoUsername) {
                    auth.updateLoginDisplay(user, loginBtn);
                    uploadSection.style.display = 'block';
                    profileSection.style.display = 'block';
                    modelSection.style.display = 'block';
                    profileLinksSection.style.display = 'block';
                    loginMessage.style.display = 'none';
                    if (myPortalLink) myPortalLink.style.display = 'block';
                    fetchRepoDetails();
                    fetchModels();
                    await setupCreatorLinks();
                    await setupConfigForm();
                    updateStorageUsage();
                    await updatePublishStatus();
                } else {
                    loginBtn.innerHTML = 'Login with GitHub';
                    loginBtn.classList.remove('profile');
                    loginBtn.disabled = false;
                    uploadSection.style.display = 'none';
                    profileSection.style.display = 'none';
                    modelSection.style.display = 'none';
                    profileLinksSection.style.display = 'none';
                    linksForm.style.display = 'none';
                    configForm.style.display = 'none';
                    enableCreatorLinksBtn.style.display = 'none';
                    creatorLinksDisclaimer.style.display = 'none';
                    profileDropdown.style.display = 'none';
                    if (myPortalLink) myPortalLink.style.display = 'none';
                    loginMessage.style.display = 'block';
                    loginMessage.textContent = `This portal is for the site owner (${window.config.glbRepoUsername}) only. Visit the main page to explore models.`;
                }
            } catch (error) {
                showNotification(`Error fetching user: ${error.message}`, true);
                console.error('User fetch error:', error);
            }
        } else {
            loginBtn.innerHTML = 'Login with GitHub';
            loginBtn.classList.remove('profile');
            loginBtn.disabled = false;
            uploadSection.style.display = 'none';
            profileSection.style.display = 'none';
            modelSection.style.display = 'none';
            profileLinksSection.style.display = 'none';
            linksForm.style.display = 'none';
            configForm.style.display = 'none';
            enableCreatorLinksBtn.style.display = 'none';
            creatorLinksDisclaimer.style.display = 'none';
            profileDropdown.style.display = 'none';
            if (myPortalLink) myPortalLink.style.display = 'none';
            loginMessage.style.display = 'block';
            loginMessage.textContent = 'Please log in with GitHub to access the portal.';
        }
    });

    loginBtn.addEventListener('click', async () => {
        if (loginBtn.classList.contains('profile')) {
            dropdownVisible = !dropdownVisible;
            profileDropdown.style.display = dropdownVisible ? 'block' : 'none';
        } else {
            const error = await auth.loginWithGitHub();
            if (error) showNotification(`Login failed: ${error}`, true);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await auth.signOut();
        loginBtn.innerHTML = 'Login with GitHub';
        loginBtn.classList.remove('profile');
        loginBtn.disabled = false;
        profileDropdown.style.display = 'none';
        dropdownVisible = false;
        uploadSection.style.display = 'none';
        profileSection.style.display = 'none';
        modelSection.style.display = 'none';
        profileLinksSection.style.display = 'none';
        linksForm.style.display = 'none';
        configForm.style.display = 'none';
        enableCreatorLinksBtn.style.display = 'none';
        creatorLinksDisclaimer.style.display = 'none';
        loginMessage.style.display = 'block';
        loginMessage.textContent = 'Please log in with GitHub to access the portal.';
    });

    document.addEventListener('click', (e) => {
        if (!loginBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.style.display = 'none';
            dropdownVisible = false;
        }
    });
}

async function updateStorageUsage() {
    if (!auth.getToken()) {
        document.getElementById('usage').textContent = '0 GB';
        document.getElementById('progress-bar').style.width = '0%';
        return;
    }
    try {
        const repoCheck = await fetch(`https://api.github.com/repos/${window.config.glbRepoUsername}/${window.config.glbRepoName}`, {
            headers: { 'Authorization': `token ${auth.getToken()}` }
        });
        if (!repoCheck.ok) {
            document.getElementById('usage').textContent = 'No models';
            showNotification('Error: Please create and upload models to your model repository first', true);
            return;
        }
        const response = await fetch(`https://api.github.com/repos/${window.config.glbRepoUsername}/${window.config.glbRepoName}/contents`, {
            headers: { 'Authorization': `token ${auth.getToken()}` }
        });
        if (!response.ok) throw new Error('Failed to fetch repo contents');
        const contents = await response.json();
        let totalSize = 0;
        for (const file of contents) {
            if (file.size) totalSize += file.size;
        }
        const sizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
        const percentage = (sizeGB / 5) * 100;
        document.getElementById('usage').textContent = `${sizeGB} GB`;
        document.getElementById('progress-bar').style.width = `${Math.min(percentage, 100)}%`;
    } catch (error) {
        console.error('Error fetching storage usage:', error);
        document.getElementById('usage').textContent = 'Error';
    }
}

async function setupCreatorLinks() {
    try {
        const repoName = window.config.siteRepoName || `${username}.github.io`;
        const linksResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/links.json`, {
            headers: { 'Authorization': `token ${auth.getToken()}` }
        });
        if (linksResponse.ok) {
            const data = await linksResponse.json();
            const links = JSON.parse(atob(data.content));
            websiteLinkInput.value = links.website || '';
            xLinkInput.value = links.x || '';
            donationLinkInput.value = links.donation || '';
            linksForm.style.display = 'block';
            configForm.style.display = 'block';
            enableCreatorLinksBtn.style.display = 'none';
            creatorLinksDisclaimer.style.display = 'none';
        } else if (linksResponse.status === 404) {
            enableCreatorLinksBtn.style.display = 'block';
            creatorLinksDisclaimer.style.display = 'block';
            linksForm.style.display = 'none';
            configForm.style.display = 'none';
        }
    } catch (error) {
        showNotification(`Error setting up creator links: ${error.message}`, true);
        console.error('Error setting up creator links:', error);
    }
}

async function setupConfigForm() {
    try {
        if (!window.config) await loadConfig();
        siteTitleInput.value = window.config.siteTitle || '';
        siteRepoOwnerInput.value = window.config.siteRepoOwner || '';
        websiteRepoNameInput.value = window.config.siteRepoName || '';
        thumbnailFileInput.value = '';
        thumbnailDropZone.textContent = window.config.thumbnailPath ? 'thumbnail.jpg' : '';
        thumbnailDropZone.style.backgroundImage = window.config.thumbnailPath ? 'none' : "url('dragdrop.svg')";
        glbRepoOwnerInput.value = window.config.glbRepoUsername || '';
        glbRepoNameInput.value = window.config.glbRepoName || '';
    } catch (error) {
        showNotification(`Error loading config: ${error.message}`, true);
        console.error('Error loading config:', error);
    }
}

async function updatePublishStatus() {
    try {
        if (!window.config || !window.config.siteRepoName) {
            await loadConfig();
            if (!window.config.siteRepoName) {
                throw new Error('Website repository name not found in config');
            }
        }
        const repoName = window.config.siteRepoName;
        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/topics`, {
            headers: {
                'Authorization': `token ${auth.getToken()}`,
                'Accept': 'application/vnd.github.mercy-preview+json'
            }
        });
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Website repo (${repoName}) not found`);
            }
            throw new Error('Failed to fetch topics');
        }
        const data = await response.json();
        const isPublic = data.names.includes('glbtools');
        publishLabel.textContent = isPublic ? 'Site is Public' : 'Site is Private';
        publishLabel.className = isPublic ? 'public' : 'private';
        publishToggleBtn.textContent = isPublic ? 'Go Private' : 'Go Public';
        publishToggleBtn.className = isPublic ? 'private' : 'public';
    } catch (error) {
        showNotification(`Error checking publish status: ${error.message}`, true);
        publishLabel.textContent = `Error: ${error.message}`;
    }
}

enableCreatorLinksBtn.addEventListener('click', async () => {
    try {
        linksForm.style.display = 'block';
        configForm.style.display = 'block';
        enableCreatorLinksBtn.style.display = 'none';
        creatorLinksDisclaimer.style.display = 'none';
        showNotification('Creator links enabled! Add your links and save.');
    } catch (error) {
        showNotification(`Error enabling creator links: ${error.message}`, true);
    }
});

saveLinksBtn.addEventListener('click', async () => {
    const links = {
        website: websiteLinkInput.value.trim(),
        x: xLinkInput.value.trim(),
        donation: donationLinkInput.value.trim()
    };
    const content = btoa(JSON.stringify(links, null, 2));
    try {
        const repoName = window.config.siteRepoName || `${username}.github.io`;
        let sha = null;
        const existingFile = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/links.json`, {
            headers: { 'Authorization': `token ${auth.getToken()}` }
        });
        if (existingFile.ok) {
            const fileData = await existingFile.json();
            sha = fileData.sha;
        }
        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/links.json`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${auth.getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: 'Update creator links', 
                content: content,
                sha: sha
            })
        });
        if (!response.ok) throw new Error('Failed to save links');
        showNotification('Creator links saved successfully!');
    } catch (error) {
        showNotification(`Error saving links: ${error.message}`, true);
    }
});

saveConfigBtn.addEventListener('click', async () => {
    const updatedConfig = {
        glbRepoUsername: glbRepoOwnerInput.value.trim(),
        glbRepoName: glbRepoNameInput.value.trim(),
        supabaseUrl: window.config.supabaseUrl,
        supabaseAnonKey: window.config.supabaseAnonKey,
        siteTitle: siteTitleInput.value.trim(),
        thumbnailPath: window.config.thumbnailPath || 'thumbnail.jpg',
        siteRepoOwner: siteRepoOwnerInput.value.trim(),
        siteRepoName: websiteRepoNameInput.value.trim()
    };
    const thumbnailFile = thumbnailFileInput.files[0];
    if (thumbnailFile) {
        if (thumbnailFile.size > 1024 * 1024) {
            showNotification('Thumbnail must be less than 100KB', true);
            return;
        }
        try {
            await uploadFile(updatedConfig.siteRepoOwner, updatedConfig.siteRepoName, 'thumbnail.jpg', thumbnailFile);
            updatedConfig.thumbnailPath = 'thumbnail.jpg';
        } catch (error) {
            showNotification(`Error uploading thumbnail: ${error.message}`, true);
            return;
        }
    }
    const content = btoa(JSON.stringify(updatedConfig, null, 2));
    try {
        const configResponse = await fetch(`https://api.github.com/repos/${updatedConfig.siteRepoOwner}/${updatedConfig.siteRepoName}/contents/config.json`, {
            headers: { 'Authorization': `token ${auth.getToken()}` }
        });
        if (!configResponse.ok) throw new Error('Failed to fetch config.json');
        const configData = await configResponse.json();
        const sha = configData.sha;

        const response = await fetch(`https://api.github.com/repos/${updatedConfig.siteRepoOwner}/${updatedConfig.siteRepoName}/contents/config.json`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${auth.getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: 'Update config.json', 
                content: content, 
                sha: sha 
            })
        });
        if (!response.ok) throw new Error('Failed to save config');
        window.config = updatedConfig;
        document.querySelector('.logo').textContent = window.config.siteTitle || 'CLONE.TOOLS';
        document.getElementById('dynamic-title').textContent = window.config.siteTitle || 'CLONE.TOOLS';
        showNotification('Config saved successfully! Refresh to see changes.');
        await setupConfigForm();
        await updatePublishStatus();
    } catch (error) {
        showNotification(`Error saving config: ${error.message}`, true);
    }
});

publishToggleBtn.addEventListener('click', async () => {
    try {
        const repoName = window.config.siteRepoName || `${username}.github.io`;
        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/topics`, {
            headers: {
                'Authorization': `token ${auth.getToken()}`,
                'Accept': 'application/vnd.github.mercy-preview+json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch topics');
        const data = await response.json();
        const currentTopics = data.names;
        const isPublic = currentTopics.includes('glbtools');

        if (isPublic) {
            const newTopics = currentTopics.filter(topic => topic !== 'glbtools');
            await fetch(`https://api.github.com/repos/${username}/${repoName}/topics`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${auth.getToken()}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.mercy-preview+json'
                },
                body: JSON.stringify({ names: newTopics })
            });
            showNotification('Site set to Private');
        } else {
            currentTopics.push('glbtools');
            await fetch(`https://api.github.com/repos/${username}/${repoName}/topics`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${auth.getToken()}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.mercy-preview+json'
                },
                body: JSON.stringify({ names: currentTopics })
            });
            showNotification('Site set to Public');
        }
        await updatePublishStatus();
    } catch (error) {
        showNotification(`Error toggling publish status: ${error.message}`, true);
    }
});

function setupDragAndDrop(input, dropZone) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
    });
    dropZone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
        validateFilenames();
        if (input.files.length) {
            dropZone.textContent = input.files.length > 1 ? `${input.files.length} files` : input.files[0].name;
            dropZone.style.backgroundImage = 'none';
        } else {
            resetDropZone(dropZone);
        }
    });
}

function validateFilenames() {
    const glbFile = glbFileInput.files[0];
    const txtFile = txtFileInput.files[0];
    const pngFile = pngFileInput.files[0];
    if (!glbFile) return;
    const baseName = glbFile.name.replace('.glb', '');
    let mismatch = false;
    if (txtFile && txtFile.name !== `${baseName}.txt`) mismatch = true;
    if (pngFile && pngFile.name !== `${baseName}.png`) mismatch = true;
    document.querySelector('.naming-rule').style.display = mismatch ? 'block' : 'none';
}

async function fetchRepoDetails() {
    if (!auth.getToken()) {
        showNotification('Error: No GitHub token available.', true);
        return;
    }
    try {
        repoList.innerHTML = '';
        const li = document.createElement('li');
        li.textContent = window.config.glbRepoName;
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        const renameBtn = document.createElement('button');
        renameBtn.textContent = 'Rename';
        renameBtn.className = 'rename-btn';
        renameBtn.onclick = () => renameRepo(window.config.glbRepoName);
        buttonContainer.appendChild(renameBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => window.open('https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository', '_blank');
        buttonContainer.appendChild(deleteBtn);

        li.appendChild(buttonContainer);
        repoList.appendChild(li);
    } catch (error) {
        showNotification(`Error fetching repo details: ${error.message}`, true);
    }
}

async function fetchModels() {
    try {
        const repoCheck = await fetch(`https://api.github.com/repos/${window.config.glbRepoUsername}/${window.config.glbRepoName}`, {
            headers: { 'Authorization': `token ${auth.getToken()}` }
        });
        if (!repoCheck.ok) {
            modelList.innerHTML = '<li>No models found</li>';
            showNotification('Error: Please create and upload models to your model repository first', true);
            return;
        }
        const response = await fetch(`https://api.github.com/repos/${window.config.glbRepoUsername}/${window.config.glbRepoName}/contents`, {
            headers: { 'Authorization': `token ${auth.getToken()}` }
        });
        if (!response.ok) throw new Error('Failed to fetch repo contents');
        const contents = await response.json();
        modelList.innerHTML = '';
        const glbFiles = contents.filter(item => item.name.endsWith('.glb'));
        glbFiles.forEach(item => {
            const baseName = item.name.replace('.glb', '');
            const li = document.createElement('li');
            li.textContent = baseName;
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';

            const renameBtn = document.createElement('button');
            renameBtn.textContent = 'Rename';
            renameBtn.className = 'rename-btn';
            renameBtn.onclick = () => renameModelFolder(window.config.glbRepoName, baseName);
            buttonContainer.appendChild(renameBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => deleteModelFolder(window.config.glbRepoName, baseName);
            buttonContainer.appendChild(deleteBtn);

            li.appendChild(buttonContainer);
            modelList.appendChild(li);
        });
    } catch (error) {
        showNotification(`Error fetching models: ${error.message}`, true);
    }
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showNotification('Uploading...');
    const repoName = window.config.glbRepoName;

    const isBulk = bulkToggle.checked;

    if (isBulk) {
        const glbFiles = document.getElementById('glb-files').files;
        const txtFiles = document.getElementById('txt-files').files;
        const pngFiles = document.getElementById('png-files').files;

        if (!glbFiles.length || !pngFiles.length) {
            showNotification('Please provide at least one .glb and .png file.', true);
            return;
        }

        const txtMap = new Map([...txtFiles].map(f => [f.name.replace('.txt', ''), f]));
        const pngMap = new Map([...pngFiles].map(f => [f.name.replace('.png', ''), f]));
        const fileSets = [...glbFiles].map(glb => ({
            baseName: glb.name.replace('.glb', ''),
            glb,
            txt: txtMap.get(glb.name.replace('.glb', '')),
            png: pngMap.get(glb.name.replace('.glb', ''))
        })).filter(set => set.png);

        if (!fileSets.length) {
            showNotification('No valid sets found (.glb and .png required).', true);
            return;
        }

        for (let i = 0; i < fileSets.length; i++) {
            const set = fileSets[i];
            showNotification(`Uploading ${i + 1}/${fileSets.length}: ${set.baseName}...`);
            if (set.png.size > 100 * 1024) {
                showNotification(`Error: ${set.baseName}.png exceeds 100KB`, true);
                return;
            }
            try {
                await uploadFile(username, repoName, `${set.baseName}.glb`, set.glb);
                if (set.txt) await uploadFile(username, repoName, `${set.baseName}.txt`, set.txt);
                await uploadFile(username, repoName, `${set.baseName}.png`, set.png);
            } catch (error) {
                showNotification(`Error uploading ${set.baseName}: ${error.message}`, true);
                return;
            }
        }
        showNotification('Bulk upload successful!');
        updateStorageUsage();
    } else {
        const glbFile = glbFileInput.files[0];
        const txtFile = txtFileInput.files[0];
        const pngFile = pngFileInput.files[0];
        const baseName = glbFile ? glbFile.name.replace('.glb', '') : null;

        if (!glbFile || !pngFile) {
            showNotification('Please provide a .glb and .png file.', true);
            return;
        }
        if ((txtFile && txtFile.name !== `${baseName}.txt`) || pngFile.name !== `${baseName}.png`) {
            showNotification('Your .glb, .txt, and .png must have the same name', true);
            return;
        }
        if (pngFile.size > 100 * 1024) {
            showNotification('Thumbnail must be less than 100KB', true);
            return;
        }

        try {
            await uploadFile(username, repoName, `${baseName}.glb`, glbFile);
            if (txtFile) await uploadFile(username, repoName, `${baseName}.txt`, txtFile);
            await uploadFile(username, repoName, `${baseName}.png`, pngFile);
            showNotification('Upload successful!');
            updateStorageUsage();
        } catch (error) {
            showNotification(`Error: ${error.message}`, true);
        }
    }
    uploadForm.reset();
    resetDropZones();
});

async function createRepo(repoName) {
    try {
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: { 'Authorization': `token ${auth.getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: repoName, private: false })
        });
        if (!response.ok) throw new Error('Failed to create repo');
        showNotification(`Repository ${repoName} created!`);
    } catch (error) {
        showNotification(`Error creating repo: ${error.message}`, true);
    }
}

async function uploadFile(username, repoName, path, file) {
    const reader = new FileReader();
    const content = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });

    let sha = null;
    try {
        const checkResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${path}`, {
            headers: { 'Authorization': `token ${auth.getToken()}` }
        });
        if (checkResponse.ok) {
            const fileData = await checkResponse.json();
            sha = fileData.sha;
        }
    } catch (error) {
        if (error.status !== 404) {
            throw new Error(`Failed to check file existence: ${error.message}`);
        }
    }

    const body = {
        message: sha ? `Update ${path}` : `Add ${path}`,
        content: content
    };
    if (sha) {
        body.sha = sha;
    }

    const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${auth.getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Failed to upload ${path}`);
}

async function renameRepo(oldName) {
    const newName = prompt(`Enter new name for ${oldName}:`, oldName);
    if (!newName || newName === oldName) return;
    try {
        const response = await fetch(`https://api.github.com/repos/${username}/${oldName}`, {
            method: 'PATCH',
            headers: { 'Authorization': `token ${auth.getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });
        if (!response.ok) throw new Error('Failed to rename repo');
        showNotification(`Repository renamed to ${newName}.`);
        window.config.glbRepoName = newName;
        fetchRepoDetails();
        fetchModels();
    } catch (error) {
        showNotification(`Error renaming repo: ${error.message}`, true);
    }
}

async function deleteModelFolder(repoName, baseName) {
    if (!confirm(`Delete model ${baseName} and its files? This cannot be undone.`)) return;
    try {
        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents`, {
            headers: { 'Authorization': `token ${auth.getToken()}` }
        });
        if (!response.ok) throw new Error('Failed to fetch repo contents');
        const contents = await response.json();

        const filesToDelete = contents.filter(item => 
            item.name === `${baseName}.glb` || 
            item.name === `${baseName}.txt` || 
            item.name === `${baseName}.png`
        );

        for (const item of filesToDelete) {
            await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${item.name}`, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${auth.getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Delete ${item.name}`, sha: item.sha })
            });
        }
        showNotification(`Model ${baseName} deleted.`);
        fetchModels();
        updateStorageUsage();
    } catch (error) {
        showNotification(`Error deleting model: ${error.message}`, true);
    }
}

async function renameModelFolder(repoName, oldBaseName) {
    const newBaseName = prompt(`Enter new name for ${oldBaseName}:`, oldBaseName);
    if (!newBaseName || newBaseName === oldBaseName) return;
    try {
        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents`, {
            headers: { 'Authorization': `token ${auth.getToken()}` }
        });
        if (!response.ok) throw new Error('Failed to fetch repo contents');
        const contents = await response.json();

        const filesToRename = contents.filter(item => 
            item.name === `${oldBaseName}.glb` || 
            item.name === `${oldBaseName}.txt` || 
            item.name === `${oldBaseName}.png`
        );

        for (const item of filesToRename) {
            const oldPath = item.name;
            const newPath = `${newBaseName}${oldPath.substring(oldPath.lastIndexOf('.'))}`;
            const fileResponse = await fetch(item.download_url);
            const blob = await fileResponse.blob();
            const reader = new FileReader();
            const base64Content = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(blob);
            });

            await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${newPath}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${auth.getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Rename ${oldPath} to ${newPath}`, content: base64Content })
            });

            await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${oldPath}`, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${auth.getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Delete ${oldPath}`, sha: item.sha })
            });
        }
        showNotification(`Model renamed to ${newBaseName}.`);
        fetchModels();
        updateStorageUsage();
    } catch (error) {
        showNotification(`Error renaming model: ${error.message}`, true);
    }
}

refreshReposBtn.addEventListener('click', () => {
    fetchRepoDetails();
    fetchModels();
    updateStorageUsage();
    updatePublishStatus();
});

bulkToggle.addEventListener('change', () => {
    document.getElementById('single-upload').style.display = bulkToggle.checked ? 'none' : 'block';
    document.getElementById('bulk-upload').style.display = bulkToggle.checked ? 'block' : 'none';
});

function resetDropZones() {
    resetDropZone(glbDropZone);
    resetDropZone(txtDropZone);
    resetDropZone(pngDropZone);
    resetDropZone(document.getElementById('glb-bulk-drop-zone'));
    resetDropZone(document.getElementById('txt-bulk-drop-zone'));
    resetDropZone(document.getElementById('png-bulk-drop-zone'));
    resetDropZone(thumbnailDropZone);
}

function resetDropZone(zone) {
    zone.textContent = '';
    zone.style.backgroundImage = "url('dragdrop.svg')";
}

setupDragAndDrop(glbFileInput, glbDropZone);
setupDragAndDrop(txtFileInput, txtDropZone);
setupDragAndDrop(pngFileInput, pngDropZone);
setupDragAndDrop(document.getElementById('glb-files'), document.getElementById('glb-bulk-drop-zone'));
setupDragAndDrop(document.getElementById('txt-files'), document.getElementById('txt-bulk-drop-zone'));
setupDragAndDrop(document.getElementById('png-files'), document.getElementById('png-bulk-drop-zone'));
setupDragAndDrop(thumbnailFileInput, thumbnailDropZone);

checkSession();