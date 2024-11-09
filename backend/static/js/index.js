async function toggleDetails(email) {
    const details = document.getElementById(`details-${email}`);
    const detailsContent = document.getElementById(`details-content-${email}`);
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        detailsContent.innerHTML = '<div class="loading">Loading details...</div>';
        
        try {
            const response = await fetch(`/api/lead/${email}/details`);
            const data = await response.json();
            
            const detailsHtml = `
                <div class="details-container">
                    <div class="details-left">
                        <div class="details-section">
                            <h3>Company Details</h3>
                            <div class="detail-item">
                                <strong>Company Name:</strong> ${data.company_info.company_name}
                            </div>
                            <div class="detail-item">
                                <strong>Industry:</strong> ${data.company_info.industry}
                            </div>
                            <div class="detail-item">
                                <strong>Company Size:</strong> ${data.company_info.company_size}
                            </div>
                            <div class="detail-item">
                                <strong>Description:</strong>
                                <p>${data.company_info.company_description || 'Not available'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="details-right">
                        ${data.email_status.status.toUpperCase() === 'SENT' ? `
                            <div class="details-section">
                                <h3>Email History</h3>
                                <div class="detail-item">
                                    <strong>Status:</strong> 
                                    <span class="status-chip status-${data.email_status.status.toLowerCase()}">
                                        ${data.email_status.status}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <strong>Sent From:</strong> ${data.email_status.sender_email}
                                </div>
                                <div class="detail-item">
                                    <strong>Subject:</strong> ${data.email_status.email_subject}
                                </div>
                                <div class="detail-item">
                                    <strong>Content:</strong>
                                    <div>${data.email_status.email_content}</div>
                                </div>
                                <div class="detail-item">
                                    <strong>Last Updated:</strong> ${data.email_status.last_message}
                                </div>
                            </div>
                        ` : '<div class="details-section"><p>No email history available</p></div>'}
                    </div>
                </div>
            `;
            
            detailsContent.innerHTML = detailsHtml;
        } catch (error) {
            console.error('Error fetching lead details:', error);
            detailsContent.innerHTML = '<p class="error">Error loading details</p>';
        }
    } else {
        details.style.display = 'none';
    }
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