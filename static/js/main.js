const navItems = document.querySelectorAll('.nav-item');
const leadDetails = document.getElementById('lead-details');

function getStatusChip(status) {
    return `<span class="status-chip status-${status.toLowerCase()}">${status}</span>`;
}

function createEmailEditor(email, senderConfigs) {
    return `
        <div class="email-editor" style="display: none;">
            <div class="sender-selection">
                <label for="sender-email">Send from:</label>
                <select id="sender-email" class="sender-email-select">
                    ${senderConfigs.map(sender => `
                        <option value="${sender.email}">${sender.email} (${sender.display_name})</option>
                    `).join('')}
                </select>
            </div>
            <input type="text" id="email-subject" class="email-subject" placeholder="Email subject..." />
            <textarea id="email-content" rows="10" placeholder="Email content will appear here..."></textarea>
            <div class="editor-actions">
                <button class="button button-primary" id="send-email-btn" onclick="sendEmail('${email}')">Send Email</button>
            </div>
        </div>
    `;
}

async function generateEmail(leadEmail) {
    const generateBtn = document.getElementById('generate-email-btn');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
        const response = await fetch(`/api/lead/${leadEmail}/generate-email`, {
            method: 'POST'
        });
        const data = await response.json();
        
        const emailEditor = document.querySelector('.email-editor');
        if (emailEditor) {
            emailEditor.style.display = 'block';
            emailEditor.querySelector('#email-subject').value = data.subject;
            emailEditor.querySelector('#email-content').value = data.email;
            generateBtn.textContent = 'Regenerate Email';
        }
    } catch (error) {
        console.error('Error generating email:', error);
    } finally {
        generateBtn.disabled = false;
    }
}

async function sendEmail(leadEmail) {
    const sendButton = document.querySelector('#send-email-btn');
    const originalText = sendButton.textContent;
    sendButton.textContent = 'Sending...';
    sendButton.disabled = true;

    const subject = document.querySelector('#email-subject').value;
    const content = document.querySelector('#email-content').value;
    const senderEmail = document.querySelector('#sender-email').value;
    
    try {
        const response = await fetch(`/api/lead/${leadEmail}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email_subject: subject,
                email_content: content,
                sender_email: senderEmail
            })
        });
        
        if (response.ok) {
            loadLeadDetails(leadEmail);
        }
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = originalText;
    }
}


async function loadLeadDetails(leadEmail) {
    try {
        const [leadResponse, configResponse] = await Promise.all([
            fetch(`/api/lead/${leadEmail}`),
            fetch('/api/sender-configs')
        ]);
        
        const [data, senderConfigs] = await Promise.all([
            leadResponse.json(),
            configResponse.json()
        ]);
        
        leadDetails.innerHTML = `
            <div class="lead-header">
                <h2>${data.company_name}</h2>
                ${getStatusChip(data.status_info.status)}
            </div>
            <div class="lead-info" data-lead-email="${data.email}">
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Domain:</strong> ${data.company_domain}</p>
            </div>
            ${data.status_info.status ? `
                <div class="email-generator">
                    <button class="button button-primary" id="generate-email-btn" onclick="generateEmail('${data.email}')">
                        Generate Cold Email
                    </button>
                    ${createEmailEditor(data.email, senderConfigs)}
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