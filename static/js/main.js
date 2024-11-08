const navItems = document.querySelectorAll('.nav-item');
const leadDetails = document.getElementById('lead-details');

function getStatusChip(status) {
    return `<span class="status-chip status-${status.toLowerCase()}">${status}</span>`;
}

function createEmailEditor(leadEmail) {
    return `
        <div class="email-editor">
            <textarea id="email-content" placeholder="Email content..."></textarea>
            <div class="button-group">
                <button class="button button-secondary" onclick="previewEmail()">Preview</button>
                <button class="button button-primary" onclick="sendEmail('${leadEmail}')">Send Email</button>
            </div>
        </div>
    `;
}

async function generateEmail(leadEmail) {
    try {
        const response = await fetch(`/api/lead/${leadEmail}/generate-email`, {
            method: 'POST'
        });
        const data = await response.json();
        
        const emailEditor = document.querySelector('.email-editor');
        if (emailEditor) {
            emailEditor.querySelector('#email-content').value = data.email;
        }
    } catch (error) {
        console.error('Error generating email:', error);
    }
}

async function sendEmail(leadEmail) {
    const content = document.querySelector('#email-content').value;
    try {
        const response = await fetch(`/api/lead/${leadEmail}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email_content: content
            })
        });
        
        if (response.ok) {
            // Refresh lead details to show updated status
            loadLeadDetails(leadEmail);
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

function previewEmail() {
    const content = document.querySelector('#email-content').value;
    // Add your preview logic here
    alert('Preview: ' + content);
}

async function loadLeadDetails(leadEmail) {
    try {
        const response = await fetch(`/api/lead/${leadEmail}`);
        const data = await response.json();
        
        leadDetails.innerHTML = `
            <div class="lead-header">
                <h2>${data.company_name}</h2>
                ${getStatusChip(data.status_info.status)}
            </div>
            <div class="lead-info">
                <p><strong>Contact:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Domain:</strong> ${data.company_domain}</p>
            </div>
            ${data.status_info.is_new ? `
                <div class="email-generator">
                    <button class="button button-primary" onclick="generateEmail('${data.email}')">
                        Generate Cold Email
                    </button>
                    ${createEmailEditor(data.email)}
                </div>
            ` : ''}
        `;
    } catch (error) {
        console.error('Error fetching lead details:', error);
        leadDetails.innerHTML = '<p class="error">Error loading lead details</p>';
    }
}

navItems.forEach(item => {
    item.addEventListener('click', function() {
        navItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        loadLeadDetails(this.dataset.leadEmail);
    });
});