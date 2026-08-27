import { APP_ROUTES, InputTypes, Level } from '@/constants/enums';
import { IFormField, IFormFieldsVariables, IOption } from '@/types/app';

const useFormFields = ({ slug }: IFormFieldsVariables) => {
  const CreateSectionFormFields = (): IFormField[] => [
    {
      name: 'title',
      label: 'اسم القسم',
      type: InputTypes.TEXT,
      placeholder: 'ادخل اسم القسم',
    },
    {
      name: 'description',
      label: 'وصف القسم',
      type: InputTypes.TEXTAREA,
      placeholder: 'ادخل وصف القسم',
    },
  ];

  const pathFields = (): IFormField[] => [
    {
      name: 'name',
      label: 'اسم التراك التعليمي',
      type: InputTypes.TEXT,
      placeholder: 'ادخل اسم المسار التعليمي',
    },
    {
      name: 'heading',
      label: 'عنوان المسار',
      type: InputTypes.TEXT,
      placeholder: 'ادخل عنوان المسار',
    },
    {
      name: 'slug',
      label: 'Slug',
      type: InputTypes.TEXT,
      placeholder: 'أدخل مُعرّف المادة (يجب أن يكون فريدًا)',
    },

    {
      name: 'description',
      label: 'وصف المسار التعليمي',
      type: InputTypes.TEXTAREA,
      placeholder: 'ادخل وصف المسار التعليمي',
    },
    {
      name: 'image',
      label: 'اختار صورة المسار التعليمي',
      type: InputTypes.IMAGE,
      placeholder: 'اختار صورة المسار التعليمي',
    },
    {
      name: 'roadmap',
      label: 'رابط المسار التعليمي',
      type: 'file',
      placeholder: 'ادخل رابط المسار التعليمي',
    },
  ];

  const createCourseFields = (): IFormField[] => [
    {
      name: 'pathId',
      label: 'اختار المسار',
      type: InputTypes.SELECT,
      placeholder: 'اختر المسار',
    },
    {
      name: 'trackId',
      label: 'اختار التراك',
      type: InputTypes.SELECT,
      placeholder: 'اختر التراك',
      options: [],
    },
    {
      name: 'slug',
      label: 'اسم الدورة (Slug)',
      type: InputTypes.TEXT,
      placeholder: 'ادخل اسم الدورة يجب أن يكون فريد!',
    },
  ];

  const goalsFields = (): IFormField[] => [
    {
      name: 'knowledgeNeeded',
      label: 'ما ينبغي عليك معرفته',
      type: InputTypes.TEXTAREA,
      placeholder: 'مثال: يفضل معرفة أساسيات البرمجة أو HTML',
    },
  ];

  const basicsFields = (): IFormField[] => [
    {
      name: 'title',
      label: 'اسم الدورة',
      type: InputTypes.TEXT,
      placeholder: 'ادخل اسم الدورة',
    },
    {
      name: 'description',
      label: 'وصف الدورة',
      type: InputTypes.TEXTAREA,
      placeholder: 'ادخل وصف الدورة',
    },
    {
      name: 'shortDescription',
      label: 'وصف قصير',
      type: InputTypes.TEXTAREA,
      placeholder: 'ادخل وصف قصير',
    },
    {
      name: 'slug',
      label: 'اسم الدورة (Slug)',
      type: InputTypes.TEXT,
      placeholder: 'ادخل اسم الدورة (يجب أن يكون فريد)',
    },
    {
      name: 'level',
      label: 'مستوى الدورة',
      type: InputTypes.SELECT,
      placeholder: 'اختر مستوى الدورة',
      options: [
        { value: Level.ALL_LEVELS, label: 'جميع المستويات' },
        { value: Level.BEGINNER, label: 'مبتدئ' },
        { value: Level.INTERMEDIATE, label: 'متوسط' },
        { value: Level.ADVANCED, label: 'متقدم' },
      ],
    },
    {
      name: 'hours',
      label: 'مدة الدورة (بالساعات)',
      type: InputTypes.NUMBER,
      placeholder: 'ادخل مدة الدورة (بالساعات)',
    },
    {
      name: 'thumbnail',
      label: 'صورة الدورة',
      type: InputTypes.IMAGE,
      placeholder: 'اختار صورة الدورة',
    },
    {
      name: 'previewVideo',
      label: 'فيديو الدورة',
      type: 'file',
      placeholder: 'اختر فيديو الدورة',
    },
  ];

  const pricingFields = (): IFormField[] => [
    {
      name: 'compareAtPrice',
      label: 'سعر العرض بالسينت',
      type: InputTypes.NUMBER,
      placeholder: 'ادخل سعر العرض بالسينت',
    },
    {
      name: 'price',
      label: 'السعر الاساسي بالسينت',
      type: InputTypes.NUMBER,
      placeholder: 'ادخل سعر الدورة بالسينت',
    },
  ];

  const lessonFields = (): IFormField[] => [
    {
      name: 'title',
      label: 'اسم المحاضرة',
      type: InputTypes.TEXT,
      placeholder: 'ادخل اسم المحاضرة',
    },
    {
      name: 'description',
      label: ' وصف المحاضرة',
      type: InputTypes.TEXTAREA,
      placeholder: 'ادخل وصف المحاضرة',
    },
  ];

  const contactFields = (): IFormField[] => [
    {
      name: 'name',
      label: 'الاسم',
      type: InputTypes.TEXT,
      placeholder: 'ادخل اسمك',
    },
    {
      name: 'email',
      label: 'البريد الإلكتروني',
      type: InputTypes.EMAIL,
      placeholder: 'example@email.com',
    },
    {
      name: 'message',
      label: 'الرسالة',
      type: InputTypes.TEXTAREA,
      placeholder: 'اكتب رسالتك هنا...',
    },
  ];

  const getFormFields = (
    dynamicOptions?: Record<string, IOption[]>,
  ): IFormField[] => {
    const fields = (() => {
      switch (slug) {
        case APP_ROUTES.CONTACT:
          return contactFields();
        case APP_ROUTES.LEARNING_PATHS:
          return pathFields();

        case APP_ROUTES.COURSES:
          return createCourseFields();
        case APP_ROUTES.GOALS:
          return goalsFields();
        case APP_ROUTES.BASICS:
          return basicsFields();
        case APP_ROUTES.PRICING:
          return pricingFields();
        case APP_ROUTES.CURRICULUM:
          return CreateSectionFormFields();
        case APP_ROUTES.LESSONS:
          return lessonFields();
        default:
          return [];
      }
    })();

    if (dynamicOptions) {
      return fields.map((field: IFormField) => ({
        ...field,
        options: dynamicOptions[field.name] || field.options,
      }));
    }

    return fields;
  };

  return {
    getFormFields,
  };
};

export default useFormFields;
