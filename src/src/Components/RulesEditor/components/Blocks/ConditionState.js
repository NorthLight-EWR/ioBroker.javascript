import GenericBlock from '../GenericBlock';

const HYSTERESIS = `function __hysteresis(val, limit, state, hist, comp) {
    let cond1, cond2;
    if (comp === '>') {
        cond1 = val > limit + hist;
        cond2 = val <= limit - hist;
    } else if (comp === '<') {
        cond1 = val < limit - hist;
        cond2 = val >= limit + hist;
    } else if (comp === '>=') {
        cond1 = val >= limit + hist;
        cond2 = val < limit - hist;
    } else if (comp === '<=') {
        cond1 = val <= limit - hist;
        cond2 = val > limit + hist;
    } else if (comp === '=') {
        cond1 = val <= limit + hist && val > limit - hist;
        cond2 = val > limit + hist || val <= limit - hist;
    } else if (comp === '<>') {
        cond1 = val > limit + hist || val <= limit - hist;
        cond2 = val <= limit + hist && val > limit - hist;
    }
     
    if (!state && cond1) {
        return true;
    } else if (state && cond2) {
        return false;
    } else {
        return state;
    }
}`;

class ConditionState extends GenericBlock {
    constructor(props) {
        super(props, ConditionState.getStaticData());
    }

    isAllTriggersOnState() {
        return this.props.userRules?.triggers?.find(item => item.id === 'TriggerState') &&
            !this.props.userRules?.triggers?.find(item => item.id !== 'TriggerState');
    }

    static compile(config, context) {
        let value = config.value;
        if (value === null || value === undefined) {
            value = false;
        }
        let result;
        if (config.tagCard === '()') {
            context.prelines =  context.prelines || [];
            !context.prelines.find(item => item !== HYSTERESIS) && context.prelines.push(HYSTERESIS);
            if (config.useTrigger) {
                if (value === '') {
                    value = 0;
                }
                result = `__hysteresis(obj.state.val, ${value}, __%%STATE%%__, ${config.hist}, "${config.histComp}")`;
            } else {
                if (value === '') {
                    value = 0;
                }
                result = `__hysteresis((await getStateAsync("${config.oid}")).val, ${value}, __%%STATE%%__, ${config.hist}, "${config.histComp}")`;
            }
        } else
        if (config.tagCard !== 'includes') {
            const compare = config.tagCard === '=' ? '==' : (config.tagCard === '<>' ? '!=' : config.tagCard);
            if (config.useTrigger) {
                if (context?.trigger?.oidType === 'string') {
                    value = value.replace(/"/g, '\\"');
                    result = `obj.state.val ${compare} "${value}"`;
                } else {
                    if (value === '') {
                        value = 0;
                    }
                    result = `obj.state.val ${compare} ${value}`;
                }
            } else {
                if (config.oidType === 'string') {
                    value = value.replace(/"/g, '\\"');
                    result = `(await getStateAsync("${config.oid}")).val ${compare} "${value}"`;
                } else {
                    if (value === '') {
                        value = 0;
                    }
                    result = `(await getStateAsync("${config.oid}")).val ${compare} ${value}`;
                }
            }
        } else {
            if (config.useTrigger) {
                if (context?.trigger?.oidType === 'string') {
                    value = value.replace(/"/g, '\\"');
                    result = `obj.state.val.includes("${value}")`;
                } else {
                    result = `false`;
                }
            } else {
                if (config.oidType === 'string') {
                    value = value.replace(/"/g, '\\"');
                    result = `(await getStateAsync("${config.oid}").val).includes("${value}")`;
                } else {
                    result = `false`;
                }
            }
        }

        return result;
    }

    _setInputs(useTrigger, tagCard, oidType, oidUnit, oidStates) {
        const isAllTriggersOnState = this.isAllTriggersOnState();

        tagCard   = tagCard   || this.state.settings.tagCard;
        oidType   = oidType   || this.state.settings.oidType;
        oidUnit   = oidUnit   || this.state.settings.oidUnit;
        oidStates = oidStates || this.state.settings.oidStates;

        if (isAllTriggersOnState && useTrigger && this.props.userRules?.triggers?.length === 1) {
            oidType   = this.props.userRules.triggers[0].oidType;
            oidUnit   = this.props.userRules.triggers[0].oidUnit;
            oidStates = this.props.userRules.triggers[0].oidStates;
        }

        const _tagCardArray = ConditionState.getStaticData().tagCardArray;
        const tag = _tagCardArray.find(item => item.title === tagCard);
        let tagCardArray;
        let options = null;

        if (oidType === 'number') {
            tagCardArray = [
                {
                    title: '=',
                    title2: '[equal]',
                    text: 'equal to'
                },
                {
                    title: '>=',
                    title2: '[greater or equal]',
                    text: 'greater or equal'
                },
                {
                    title: '>',
                    title2: '[greater]',
                    text: 'greater than'
                },
                {
                    title: '<=',
                    title2: '[less or equal]',
                    text: 'less or equal'
                },
                {
                    title: '<',
                    title2: '[less]',
                    text: 'less than'
                },
                {
                    title: '<>',
                    title2: '[not equal]',
                    text: 'not equal to'
                },
                {
                    title: '<>',
                    title2: '[not equal]',
                    text: 'not equal to'
                },
                {
                    title: '()',
                    title2: '[hysteresis]',
                    text: 'hysteresis'
                }
            ];

            if (oidStates) {
                options = Object.keys(oidStates).map(val =>
                    ({value: val, title: oidStates[val]}));
            }
        } else if (oidType === 'boolean') {
            tagCardArray = [
                {
                    title: '=',
                    title2: '[equal]',
                    text: 'equal to'
                },
                {
                    title: '<>',
                    title2: '[not equal]',
                    text: 'not equal to'
                }
            ];
            options = [
                {title: 'false', value: false},
                {title: 'true', value: true},
            ];
        } else {
            tagCardArray = [
                {
                    title: '=',
                    title2: '[equal]',
                    text: 'equal to'
                },
                {
                    title: '>=',
                    title2: '[greater or equal]',
                    text: 'greater or equal'
                },
                {
                    title: '>',
                    title2: '[greater]',
                    text: 'greater than'
                },
                {
                    title: '<=',
                    title2: '[less or equal]',
                    text: 'less or equal'
                },
                {
                    title: '<',
                    title2: '[less]',
                    text: 'less than'
                },
                {
                    title: '<>',
                    title2: '[not equal]',
                    text: 'not equal to'
                },
                {
                    title: '.',
                    title2: '[includes]',
                    text: 'includes'
                }
            ];
            if (oidStates) {
                options = Object.keys(oidStates).map(val =>
                    ({value: val, title: oidStates[val]}));
            }
        }

        let settings = null;
        if (!tagCardArray.find(item => item.title === tagCard)) {
            tagCard = tagCardArray[0].title;
            settings = settings || {...this.state.settings};
            settings.tagCard = tagCard;
        }

        let inputs;
        let renderText = {
            nameRender: 'renderText',
            defaultValue: '',
            attr: 'value',
            frontText: tagCard === '()' ? 'limit' : (tag?.text || 'compare with'),
            backText: oidUnit
        };

        if (options) {
            renderText = {
                nameRender: 'renderSelect',
                defaultValue: options[0].value,
                options,
                attr: 'value',
                frontText: tag?.text || 'compare with',
                backText: oidUnit
            };
            if (!options.find(item => item.value === this.state.settings.value)) {
                settings = settings || {...this.state.settings};
                settings.value = options[0].value;
            }
            if (options.length <= 2) {
                tagCardArray = [
                    {
                        title: '=',
                        title2: '[equal]',
                        text: 'equal to'
                    },
                    {
                        title: '<>',
                        title2: '[not equal]',
                        text: 'not equal to'
                    }
                ];
            }
        }

        if (isAllTriggersOnState && useTrigger) {
            inputs = [
                {
                    backText: 'use trigger value',
                    nameRender: 'renderCheckbox',
                    attr: 'useTrigger',
                    defaultValue: false,
                },
                renderText,
            ];
        } else if (isAllTriggersOnState) {
            inputs = [
                {
                    backText: 'use trigger value',
                    nameRender: 'renderCheckbox',
                    attr: 'useTrigger',
                },
                {
                    nameRender: 'renderObjectID',
                    attr: 'oid',
                    defaultValue: '',
                },
                renderText,
            ];
        } else {
            inputs = [
                {
                    nameRender: 'renderObjectID',
                    attr: 'oid',
                    defaultValue: '',
                },
                renderText,
            ];
        }

        if (tagCard === '()') {
            inputs.splice(1, 0, {
                nameRender: 'renderSelect',
                attr: 'histComp',
                defaultValue: '>',
                frontText: 'Condition',
                options: [
                    {title: '>',  value: '>'},
                    {title: '>=', value: '>='},
                    {title: '<',  value: '<'},
                    {title: '<=', value: '<='},
                    {title: '=',  value: '='},
                    {title: '<>', value: '<>'},
                ]
            });
            inputs.push({
                frontText: 'Spreading', // translate
                nameRender: 'renderNumber',
                noHelperText: true,
                attr: 'hist',
                defaultValue: 1,
                backText: oidUnit
            });
        }

        const state = {
            iconTag: true,
            tagCardArray,
            inputs
        };

        this.setState(state,() =>
            super.onTagChange(null, () => {
                if (settings) {
                    this.setState({settings});
                    this.props.onChange(settings);
                }
            }));
    }

    onValueChanged(value, attr, context) {
        if (typeof value === 'object') {
            this._setInputs(value.useTrigger, value.tagCard, value.oidType, value.states);
        } else {
            if (attr === 'useTrigger') {
                this._setInputs(value);
            } else if (attr === 'oidType') {
                this._setInputs(value, undefined, value);
            } else if (attr === 'oidUnit') {
                this._setInputs(value, undefined, undefined, value);
            } else if (attr === 'oidStates') {
                this._setInputs(value, undefined, undefined, undefined, value);
            }
        }
    }

    onUpdate() {
        this._setInputs(this.state.settings.useTrigger);
    }

    onTagChange(tagCard) {
        this._setInputs(this.state.settings.useTrigger, tagCard);
    }

    static getStaticData() {
        return {
            acceptedBy: 'conditions',
            name: { en: 'State condition', ru: 'State condition' },
            id: 'ConditionState',
            icon: 'Shuffle',
            tagCardArray: [
                {
                    title: '=',
                    title2: '[equal]',
                    text: 'equal to'
                },
                {
                    title: '>=',
                    title2: '[greater or equal]',
                    text: 'greater or equal'
                },
                {
                    title: '>',
                    title2: '[greater]',
                    text: 'greater than'
                },
                {
                    title: '<=',
                    title2: '[less or equal]',
                    text: 'less or equal'
                },
                {
                    title: '<',
                    title2: '[less]',
                    text: 'less than'
                },
                {
                    title: '<>',
                    title2: '[not equal]',
                    text: 'not equal to'
                },
                {
                    title: '.',
                    title2: '[includes]',
                    text: 'includes'
                },
                {
                    title: '()',
                    title2: '[hysteresis]',
                    text: 'hysteresis'
                }
            ],
            title: 'Compares the state value with user defined value'
        }
    }

    getData() {
        return ConditionState.getStaticData();
    }
}

export default ConditionState;