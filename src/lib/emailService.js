import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_t9riqbg';
const TEMPLATE_ALERT = 'template_jqdqiw5';
const TEMPLATE_CONFIRMATION = 'template_g9ifoai';
const PUBLIC_KEY = 'M5uSTAzyjKCoztPIY';

const instructorEmails = {
  'Wong': 'dwong2@pima.edu',
  'Frazier': 'vcfrazier@pima.edu',
  'Moreno': 'amoreno26@pima.edu',
  'Cabrera': 'acabrera@pima.edu',
  'McRoy': 'kdmcroy@pima.edu',
  'Mikesell': 'emikesell@pima.edu',
  'Quintana': 'jquintana2@pima.edu',
  'Toscano': 'ptoscano@pima.edu',
  "O'Donnell": 'todonnell7@pima.edu'
};

const notificationRecipients = [
  'todonnell7@pima.edu',
  'amoreno26@pima.edu'
];

emailjs.init(PUBLIC_KEY);

export const sendRequisitionEmails = async (requisition) => {
  const instructorEmail = instructorEmails[requisition.instructor] || '';
  const appLink = 'https://recipe-mvp-seven.vercel.app/archive';
  
  const templateParams = {
    instructor_name: `Chef ${requisition.instructor}`,
    program: requisition.program,
    class_code: requisition.course,
    class_name: requisition.week,
    class_date: requisition.class_date || 'Not specified',
    recipes: requisition.recipes || 'Not specified',
    item_count: requisition.items?.length || 0,
    total_cost: requisition.totalCost?.toFixed(2) || '0.00',
    budget: requisition.budget?.toFixed(2) || '0.00',
    app_link: appLink,
    instructor_email: instructorEmail
  };

  const results = [];

  for (const recipient of notificationRecipients) {
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ALERT, {
        ...templateParams,
        to_email: recipient
      });
      results.push({ recipient, status: 'sent' });
    } catch (error) {
      console.error(`Failed to send alert to ${recipient}:`, error);
      results.push({ recipient, status: 'failed', error });
    }
  }

  if (instructorEmail) {
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_CONFIRMATION, templateParams);
      results.push({ recipient: instructorEmail, status: 'sent', type: 'confirmation' });
    } catch (error) {
      console.error(`Failed to send confirmation to ${instructorEmail}:`, error);
      results.push({ recipient: instructorEmail, status: 'failed', error });
    }
  }

  return results;
};
