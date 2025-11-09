// 通用模态弹窗组件
function modalManager() {
  return {
    show: false,
    title: '',
    content: '',
    onConfirm: null,
    onCancel: null,
    confirmText: '确定',
    cancelText: '取消',
    
    open(options) {
      this.title = options.title || '';
      this.content = options.content || '';
      this.confirmText = options.confirmText || '确定';
      this.cancelText = options.cancelText || '取消';
      this.onConfirm = options.onConfirm || null;
      this.onCancel = options.onCancel || null;
      this.show = true;
    },
    
    close() {
      this.show = false;
      setTimeout(() => {
        this.title = '';
        this.content = '';
        this.onConfirm = null;
        this.onCancel = null;
      }, 300);
    },
    
    async handleConfirm() {
      if (this.onConfirm) {
        await this.onConfirm();
      }
      this.close();
    },
    
    handleCancel() {
      if (this.onCancel) {
        this.onCancel();
      }
      this.close();
    }
  };
}

// 表单模态弹窗组件
function formModalManager() {
  return {
    show: false,
    title: '',
    fields: [],
    formData: {},
    errors: {},
    loading: false,
    onSubmit: null,
    onCancel: null,
    submitText: '保存',
    cancelText: '取消',
    
    open(options) {
      this.title = options.title || '';
      this.fields = options.fields || [];
      this.formData = options.initialData || {};
      this.submitText = options.submitText || '保存';
      this.cancelText = options.cancelText || '取消';
      this.onSubmit = options.onSubmit || null;
      this.onCancel = options.onCancel || null;
      this.errors = {};
      this.loading = false;
      this.show = true;
      
      // 初始化表单数据
      this.fields.forEach(field => {
        if (!(field.name in this.formData)) {
          this.formData[field.name] = field.defaultValue !== undefined ? field.defaultValue : '';
        }
      });
    },
    
    close() {
      this.show = false;
      setTimeout(() => {
        this.title = '';
        this.fields = [];
        this.formData = {};
        this.errors = {};
        this.onSubmit = null;
        this.onCancel = null;
      }, 300);
    },
    
    validate() {
      this.errors = {};
      let isValid = true;
      
      this.fields.forEach(field => {
        if (field.required && !this.formData[field.name]) {
          this.errors[field.name] = `${field.label}不能为空`;
          isValid = false;
        }
        
        if (field.validate && this.formData[field.name]) {
          const error = field.validate(this.formData[field.name]);
          if (error) {
            this.errors[field.name] = error;
            isValid = false;
          }
        }
      });
      
      return isValid;
    },
    
    async handleSubmit() {
      if (!this.validate()) {
        return;
      }
      
      if (this.onSubmit) {
        this.loading = true;
        try {
          await this.onSubmit(this.formData);
          this.close();
        } catch (error) {
          console.error('表单提交失败', error);
          this.errors._form = error.message || '提交失败';
        } finally {
          this.loading = false;
        }
      }
    },
    
    handleCancel() {
      if (this.onCancel) {
        this.onCancel();
      }
      this.close();
    },
    
    getFieldValue(fieldName) {
      return this.formData[fieldName];
    },
    
    setFieldValue(fieldName, value) {
      this.formData[fieldName] = value;
      // 清除该字段的错误
      if (this.errors[fieldName]) {
        delete this.errors[fieldName];
      }
    }
  };
}

if (typeof window !== 'undefined') {
  window.modalManager = modalManager;
  window.formModalManager = formModalManager;
}
