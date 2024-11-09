function toggleDetails(email) {
    const details = document.getElementById(`details-${email}`);
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
}

async function generateEmail(email) {
    const statusElement = document.getElementById(`status-${email}`);
    const emailContentDiv = document.getElementById(`email-content-${email}`);
    const generateButton = document.getElementById(`generate-email-${email}`);
    const subjectField = document.getElementById(`subject-${email}`);
    const bodyField = document.getElementById(`body-${email}`);

    generateButton.disabled = true;
    generateButton.textContent = 'Generating...';

    try {
        statusElement.textContent = 'Generating Email...';
        const response = await fetch(`/api/lead/${email}/generate-email`, {
            method: 'POST'
        });
        const data = await response.json();
        
        subjectField.value = data.subject;
        bodyField.value = data.email;
        emailContentDiv.style.display = 'block';
        statusElement.textContent = 'Generated';
        generateButton.textContent = 'Regenerate Email';
    } catch (error) {
        statusElement.textContent = 'Generation Failed';
        generateButton.textContent = 'Generate Email';
        console.error('Error:', error);
        throw error; // Propagate error to caller
    } finally {
        generateButton.disabled = false;
    }
}

async function sendEmail(email) {
    const statusElement = document.getElementById(`status-${email}`);
    const sendButton = document.getElementById(`send-email-${email}`);
    const subjectField = document.getElementById(`subject-${email}`);
    const bodyField = document.getElementById(`body-${email}`);

    sendButton.disabled = true;

    try {
        // If content is missing, generate first
        if (!subjectField.value || !bodyField.value) {
            await generateEmail(email);
            
            // Verify generation was successful
            if (!subjectField.value || !bodyField.value) {
                throw new Error('Email generation failed - content missing');
            }
        }

        statusElement.textContent = 'Sending Email...';
        const response = await fetch(`/api/lead/${email}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email_subject: subjectField.value,
                email_content: bodyField.value
            })
        });

        const data = await response.json();
        if (data.success) {
            statusElement.textContent = 'Sent';
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        statusElement.textContent = 'Send Failed';
        console.error('Error:', error);
    } finally {
        sendButton.disabled = false;
    }
}

async function generateAndSendEmail(email) {
    const statusElement = document.getElementById(`status-${email}`);
    const subjectField = document.getElementById(`subject-${email}`);
    const bodyField = document.getElementById(`body-${email}`);

    try {
        // Generate only if status is New or fields are empty
        if (statusElement.textContent === 'New' || !subjectField.value || !bodyField.value) {
            await generateEmail(email);
        }
        
        // Only proceed with sending if we have content
        if (subjectField.value && bodyField.value) {
            await sendEmail(email);
        }
    } catch (error) {
        console.error('Error in generate and send flow:', error);
    }
}

async function autoSendEmails() {
    const leads = document.querySelectorAll('[id^="lead-row-"]');
    for (const lead of leads) {
        const email = lead.id.replace('lead-row-', '');
        await generateAndSendEmail(email);
        // Add small delay between emails
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}