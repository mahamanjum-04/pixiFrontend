const INTERESTS = [
    { value: 'oil',         label: 'Oil painting'    },
    { value: 'watercolor',  label: 'Watercolour'     },
    { value: 'acrylic',     label: 'Acrylic'         },
    { value: 'digital',     label: 'Digital art'     },
    { value: 'pencil',      label: 'Pencil & sketch' },
    { value: 'mixed media', label: 'Mixed media'     },
    { value: 'abstract',    label: 'Abstract'        },
    { value: 'portrait',    label: 'Portrait'        },
    { value: 'landscape',   label: 'Landscape'       },
    { value: 'still life',  label: 'Still life'      },
    { value: 'street art',  label: 'Street art'      },
    { value: 'photography', label: 'Photography'     },
];

export default function InterestsPicker({ selected, onChange }) {
    const toggle = (value) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {INTERESTS.map(i => (
                <button
                    key={i.value}
                    type="button"
                    onClick={() => toggle(i.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition
                        ${selected.includes(i.value)
                        ? 'bg-[#9440dd] text-white border-[#9440dd]'
                        : 'bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400'}`}
                >
                    {i.label}
                </button>
            ))}
        </div>
    );
}