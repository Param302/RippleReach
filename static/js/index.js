function toggleDetails(email) {
    const details = document.getElementById(`details-${email}`);
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
}

async function generateEmail(email) {
    const statusElement = document.getElementById(`status-${email}`);
    const emailContentDiv = document.getElementById(`email-content-${email}`);
    
    statusElement.textContent = 'Generating Email...';
    
    try {
        const response = await fetch(`/api/lead/${email}/generate-email`, {
            method: 'POST'
        });
        const data = await response.json();
        
        document.getElementById(`subject-${email}`).value = data.subject;
        document.getElementById(`body-${email}`).value = data.email;
        emailContentDiv.style.display = 'block';
        statusElement.textContent = 'Generated';
    } catch (error) {
        statusElement.textContent = 'Generation Failed';
        console.error('Error:', error);
    }
}

async function sendEmail(email) {
    const statusElement = document.getElementById(`status-${email}`);
    statusElement.textContent = 'Sending Email...';

    const subject = document.getElementById(`subject-${email}`).value;
    const content = document.getElementById(`body-${email}`).value;

    try {
        const senderResponse = await fetch('/api/sender-configs');
        const senderConfigs = await senderResponse.json();
        const senderEmail = senderConfigs[0].email;

        const response = await fetch(`/api/lead/${email}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sender_email: senderEmail,
                email_subject: subject,
                email_content: content
            })
        });

        if (response.ok) {
            statusElement.textContent = 'Sent';
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        statusElement.textContent = 'Send Failed';
        console.error('Error:', error);
    }
}

async function generateAndSendEmail(email) {
    const statusElement = document.getElementById(`status-${email}`);
    
    try {
        let data;
        const subject = document.getElementById(`subject-${email}`).value;
        const body = document.getElementById(`body-${email}`).value;
        if (statusElement.textContent === 'Generated' || !subject || !body) {
            statusElement.textContent = 'Generating Email...';  
            const response = await fetch(`/api/lead/${email}/generate-email`, {
                method: 'POST'
            });
            data = await response.json();
        }

        if (!data) {
            data = {
                subject: subject,
                email: body
            };
        }
        
        statusElement.textContent = 'Sending Email...';
        
        // const senderResponse = await fetch('/api/sender-configs');
        // const senderConfigs = await senderResponse.json();
        // const senderEmail = senderConfigs[0].email;

        const sendResponse = await fetch(`/api/lead/${email}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email_subject: data.subject,
                email_content: data.email
            })
        });

        if (sendResponse.ok) {
            statusElement.textContent = 'Sent';
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        statusElement.textContent = 'Failed';
        console.error('Error:', error);
    }
}

async function autoSendEmails() {
    const leads = document.querySelectorAll('[id^="lead-row-"]');
    for (const lead of leads) {
        const email = lead.id.replace('lead-row-', '');
        const status = document.getElementById(`status-${email}`).textContent;
        
        if (status === 'New') {
            await generateAndSendEmail(email);
            // Add small delay between emails
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}